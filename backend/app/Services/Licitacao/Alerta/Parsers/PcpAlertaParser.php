<?php

namespace App\Services\Licitacao\Alerta\Parsers;

use App\Services\Licitacao\Alerta\AlertaOpportunity;
use App\Services\Licitacao\Alerta\AlertaUrlHelper;
use App\Services\Licitacao\Alerta\EditalSegmentoMatcher;

class PcpAlertaParser
{
    public function __construct(
        private readonly AlertaUrlHelper $urls,
        private readonly EditalSegmentoMatcher $segmentos,
    ) {}

    public function supports(string $text, array $links): bool
    {
        $haystack = mb_strtolower($text.' '.implode(' ', $links));

        return str_contains($haystack, 'portaldecompraspublicas')
            || str_contains($haystack, 'aviso de licitações')
            || str_contains($haystack, 'aviso de licitacoes');
    }

    /**
     * @param  list<string>  $links
     * @return list<AlertaOpportunity>
     */
    public function parse(string $text, array $links): array
    {
        $processLinks = [];
        foreach ($links as $link) {
            if (! $this->urls->isPortalComprasPublicas($link)) {
                continue;
            }
            $clean = $this->urls->unwrapTrackingUrl($link);
            $id = $this->urls->extractPcpLicitacaoId($clean);
            if ($id === null) {
                continue;
            }
            $processLinks[$id] = preg_replace('/\?.*$/', '', $clean) ?: $clean;
        }

        $blocks = $this->extractBlocks($text);
        $opportunities = [];

        foreach ($blocks as $index => $block) {
            $objeto = $block['objeto'];
            $matched = $this->segmentos->match($objeto);
            $link = $this->pickLinkForBlock($processLinks, $index, count($blocks));

            $opportunities[] = new AlertaOpportunity(
                fonte: 'portal_compras_publicas',
                objeto: $objeto,
                orgao: $block['orgao'],
                numero: $this->extractNumeroFromLink($link),
                modalidade: null,
                dataAbertura: $block['data'],
                horaAbertura: $block['hora'],
                dataEncerramento: null,
                linkProcesso: $link,
                segmento: $matched[0] ?? null,
                segmentos: $matched,
            );
        }

        return $this->uniqueByLink($opportunities);
    }

    /**
     * @return list<array{objeto: string, orgao: ?string, data: ?string, hora: ?string}>
     */
    private function extractBlocks(string $text): array
    {
        $normalized = preg_replace("/\r\n?/", "\n", $text) ?? $text;
        $normalized = preg_replace('/[ \t]+/', ' ', $normalized) ?? $normalized;

        // Remove cabeçalho/rodapé óbvios do e-mail
        $normalized = preg_replace(
            '/Vinícius Bernardes.*?(?=Contratação|CONTRATAÇÃO|Aquisição|AQUISIÇÃO|Olá,)/su',
            '',
            $normalized,
        ) ?? $normalized;

        $pattern = '/(.+?)\n\s*(\d{2}\/\d{2}\/\d{4})\s+às\s+(\d{2}:\d{2})\s*\n\s*(.+?)(?=\n\s*(?:Contratação|CONTRATAÇÃO|Aquisição|AQUISIÇÃO|\d{2}\/\d{2}\/\d{4}|Temos, ao todo|VER MAIS|$))/su';

        $blocks = [];
        if (preg_match_all($pattern, $normalized, $matches, PREG_SET_ORDER)) {
            foreach ($matches as $match) {
                $objeto = $this->cleanObjeto($match[1]);
                $orgao = trim(preg_replace('/\s+/', ' ', $match[4]) ?? '');
                if ($objeto === '' || mb_strlen($objeto) < 20) {
                    continue;
                }
                if ($this->isNoise($objeto)) {
                    continue;
                }

                $blocks[] = [
                    'objeto' => $objeto,
                    'orgao' => $orgao !== '' ? $orgao : null,
                    'data' => $this->toIsoDate($match[2]),
                    'hora' => $match[3],
                ];
            }
        }

        return $blocks;
    }

    private function cleanObjeto(string $value): string
    {
        $value = trim(preg_replace('/\s+/', ' ', $value) ?? '');
        $value = preg_replace(
            '/Olá,.+?interesse\.\s*/iu',
            '',
            $value,
        ) ?? $value;
        $value = preg_replace(
            '/Estamos usando.+?assertivos\.\s*/iu',
            '',
            $value,
        ) ?? $value;
        $value = preg_replace(
            '/.+?<[^>]+@[^>]+>.*?Aviso de Licitações\s*/isu',
            '',
            $value,
        ) ?? $value;
        $value = preg_replace(
            '/Vin[ií]cius Bernardes.+?(?=Contrata|Aquisi|CONTRATA|AQUISI)/isu',
            '',
            $value,
        ) ?? $value;
        $value = preg_replace(
            '/Aviso de Licitações\s*|IMPORTANTE:.+?aqui\.\s*|Toda vez que nossa IA encontrar um processo,?\s*esse robô\s*aparecerá ao lado!\s*/iu',
            '',
            $value,
        ) ?? $value;
        $value = preg_replace(
            '/\d+\s*mensagem\s*|Responder a:.+?(?=Contrata|Aquisi|CONTRATA|AQUISI|$)/isu',
            '',
            $value,
        ) ?? $value;

        return trim($value);
    }

    private function isNoise(string $objeto): bool
    {
        $lower = mb_strtolower($objeto);

        return str_contains($lower, 'deseja parar de receber')
            || str_contains($lower, 'central de atendimento')
            || str_contains($lower, 'fazer simples');
    }

    private function toIsoDate(string $brDate): ?string
    {
        if (! preg_match('/^(\d{2})\/(\d{2})\/(\d{4})$/', $brDate, $m)) {
            return null;
        }

        return "{$m[3]}-{$m[2]}-{$m[1]}";
    }

    /**
     * @param  array<int, string>  $processLinks
     */
    private function pickLinkForBlock(array $processLinks, int $index, int $totalBlocks): ?string
    {
        $values = array_values($processLinks);
        if ($values === []) {
            return null;
        }

        if (isset($values[$index])) {
            return $values[$index];
        }

        // quando há mais links que blocos (linhas quebradas), usa proporção
        if ($totalBlocks > 0 && count($values) >= $totalBlocks) {
            $mapped = (int) round($index * (count($values) - 1) / max($totalBlocks - 1, 1));

            return $values[$mapped] ?? $values[0];
        }

        return $values[min($index, count($values) - 1)];
    }

    private function extractNumeroFromLink(?string $link): ?string
    {
        if (! $link) {
            return null;
        }

        if (preg_match('#/(PE|DE|RPE|DISPENSA)[^/]*?(\d{1,4})-(\d{4})-#i', $link, $m)) {
            return $m[2].'/'.$m[3];
        }

        if (preg_match('#-(\d{4,})/?$#', $link, $m)) {
            return $m[1];
        }

        return null;
    }

    /**
     * @param  list<AlertaOpportunity>  $items
     * @return list<AlertaOpportunity>
     */
    private function uniqueByLink(array $items): array
    {
        $seen = [];
        $unique = [];

        foreach ($items as $item) {
            $key = $item->linkProcesso ?: md5($item->objeto);
            if (isset($seen[$key])) {
                continue;
            }
            $seen[$key] = true;
            $unique[] = $item;
        }

        return $unique;
    }
}
