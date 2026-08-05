<?php

namespace App\Services\Licitacao\Alerta\Parsers;

use App\Services\Licitacao\Alerta\AlertaOpportunity;
use App\Services\Licitacao\Alerta\AlertaUrlHelper;
use App\Services\Licitacao\Alerta\EditalSegmentoMatcher;

class BllAlertaParser
{
    public function __construct(
        private readonly AlertaUrlHelper $urls,
        private readonly EditalSegmentoMatcher $segmentos,
    ) {}

    public function supports(string $text, array $links): bool
    {
        $haystack = mb_strtolower($text.' '.implode(' ', $links));

        return str_contains($haystack, 'bllcompras')
            || str_contains($haystack, 'divulgador de editais')
            || str_contains($haystack, 'bll -');
    }

    /**
     * @param  list<string>  $links
     * @return list<AlertaOpportunity>
     */
    public function parse(string $text, array $links): array
    {
        $processLinks = [];
        foreach ($links as $link) {
            if ($this->urls->isBll($link)) {
                $processLinks[] = $this->urls->unwrapTrackingUrl($link);
            }
        }
        $processLinks = array_values(array_unique($processLinks));

        $blocks = $this->extractBlocks($text);
        $opportunities = [];

        foreach ($blocks as $index => $block) {
            $matched = $this->segmentos->match($block['objeto']);

            $opportunities[] = new AlertaOpportunity(
                fonte: 'bll',
                objeto: $block['objeto'],
                orgao: $block['orgao'],
                numero: $block['numero'],
                modalidade: $block['modalidade'],
                dataAbertura: $block['data_inicio'],
                horaAbertura: $block['hora_inicio'],
                dataEncerramento: $block['data_fim'],
                linkProcesso: $processLinks[$index] ?? null,
                segmento: $matched[0] ?? null,
                segmentos: $matched,
                uf: $block['uf'],
                municipio: $block['municipio'],
            );
        }

        return $opportunities;
    }

    /**
     * @return list<array{
     *   objeto: string,
     *   orgao: ?string,
     *   numero: ?string,
     *   modalidade: ?string,
     *   data_inicio: ?string,
     *   hora_inicio: ?string,
     *   data_fim: ?string,
     *   uf: ?string,
     *   municipio: ?string
     * }>
     */
    private function extractBlocks(string $text): array
    {
        $normalized = preg_replace("/\r\n?/", "\n", $text) ?? $text;
        $normalized = preg_replace('/[ \t]+/', ' ', $normalized) ?? $normalized;

        // Remove bloco de contato do rodapé sem descartar editais posteriores
        $normalized = preg_replace(
            '/\n\s*Suporte ao Fornecedor\b[\s\S]*?comercial@bll\.org\.br\s*/iu',
            "\n",
            $normalized,
        ) ?? $normalized;

        $pattern = '/(?:^|\n)\s*(?:([A-ZÁÉÍÓÚÂÊÔÃÕÇ ]{4,})\n\s*)?([A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9 \/\-]+?)\s*-\s*([A-Z]{2})\n\s*([^\n]+)\n\s*(PREGÃO ELETRÔNICO|PREGAO ELETRONICO|CONCORRÊNCIA|CONCORRENCIA|DISPENSA)\s*([^\n]*)\n\s*Início Propostas:\s*(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2})\s*Fim Propostas:\s*(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2})(?:\n\s*Acessar Processo)?\n\s*OBJETO\n([\s\S]*?)(?=\n\s*(?:[A-ZÁÉÍÓÚÂÊÔÃÕÇ ]{4,}\n\s*)?[A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9 \/\-]+?\s*-\s*[A-Z]{2}\n|\z)/u';

        if (! preg_match_all($pattern, $normalized, $matches, PREG_SET_ORDER)) {
            return [];
        }

        $blocks = [];
        foreach ($matches as $match) {
            $objeto = trim(preg_replace('/\s+/', ' ', $match[11]) ?? '');
            $objeto = trim(preg_replace('/\bAcessar Processo\b/iu', '', $objeto) ?? '');
            if (mb_strlen($objeto) < 20) {
                continue;
            }

            $municipio = trim($match[2]);
            $orgao = trim(preg_replace('/\s+/', ' ', $match[4]) ?? '');
            if ($this->isNoiseHeader($municipio) || $this->isNoiseHeader($orgao)) {
                continue;
            }

            $numeroInfo = $this->parseNumeroModalidade($match[5].' '.$match[6]);
            $blocks[] = [
                'objeto' => $objeto,
                'orgao' => $orgao !== '' ? $orgao : null,
                'numero' => $numeroInfo['numero'],
                'modalidade' => $numeroInfo['modalidade'],
                'data_inicio' => $this->toIsoDate($match[7]),
                'hora_inicio' => $match[8],
                'data_fim' => $this->toIsoDate($match[9]),
                'uf' => trim($match[3]),
                'municipio' => $municipio,
            ];
        }

        return $blocks;
    }

    private function isNoiseHeader(string $value): bool
    {
        $lower = mb_strtolower($value);

        return str_contains($lower, 'suporte')
            || str_contains($lower, 'financeiro')
            || str_contains($lower, 'comercial')
            || str_contains($lower, 'divulgador');
    }

    /** @return array{numero: ?string, modalidade: string} */
    private function parseNumeroModalidade(string $raw): array
    {
        $raw = trim(preg_replace('/\s+/', ' ', $raw) ?? '');
        $modalidade = 'Pregão Eletrônico';
        $numero = null;

        if (preg_match('/(PREGÃO ELETRÔNICO|PREGAO ELETRONICO)\s*(.+)$/iu', $raw, $m)) {
            $modalidade = 'Pregão Eletrônico';
            $tail = trim($m[2]);
            $tail = preg_replace('/\s*AQUISIÇÃO.*$/iu', '', $tail) ?? $tail;
            $numero = trim($tail) ?: null;
        }

        return ['numero' => $numero, 'modalidade' => $modalidade];
    }

    private function toIsoDate(string $brDate): ?string
    {
        if (! preg_match('/^(\d{2})\/(\d{2})\/(\d{4})$/', $brDate, $m)) {
            return null;
        }

        return "{$m[3]}-{$m[2]}-{$m[1]}";
    }
}
