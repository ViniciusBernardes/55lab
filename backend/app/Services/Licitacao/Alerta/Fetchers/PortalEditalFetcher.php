<?php

namespace App\Services\Licitacao\Alerta\Fetchers;

use App\Services\Licitacao\Alerta\AlertaOpportunity;
use App\Services\Licitacao\Alerta\AlertaUrlHelper;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class PortalEditalFetcher
{
    public function __construct(private readonly AlertaUrlHelper $urls) {}

    /**
     * @return array{contents: string, filename: string, mime: string, source_url: string}
     */
    public function fetch(AlertaOpportunity $opportunity): array
    {
        return match ($opportunity->fonte) {
            'portal_compras_publicas' => $this->fetchFromPcp($opportunity),
            'bll' => $this->fetchFromBll($opportunity),
            'pncp' => $this->fetchFromPncp($opportunity),
            default => throw new RuntimeException('Fonte de alerta não suportada: '.$opportunity->fonte),
        };
    }

    /**
     * @return array{contents: string, filename: string, mime: string, source_url: string}
     */
    private function fetchFromPncp(AlertaOpportunity $opportunity): array
    {
        $controle = (string) ($opportunity->pncpControle ?? '');
        $parsed = $this->urls->parsePncpControle($controle);
        if ($parsed === null) {
            // fallback: tenta PCP/BLL pelo link quando o controle PNCP não está disponível
            $link = (string) ($opportunity->linkProcesso ?? '');
            if ($this->urls->isPortalComprasPublicas($link)) {
                return $this->fetchFromPcp($opportunity);
            }
            if ($this->urls->isBll($link)) {
                return $this->fetchFromBll($opportunity);
            }

            throw new RuntimeException('Número de Controle PNCP inválido ou ausente.');
        }

        $listUrl = sprintf(
            'https://pncp.gov.br/api/pncp/v1/orgaos/%s/compras/%d/%d/arquivos',
            $parsed['cnpj'],
            $parsed['ano'],
            $parsed['sequencial'],
        );

        $response = $this->http()->get($listUrl);
        if (! $response->successful()) {
            throw new RuntimeException('Falha ao listar documentos no PNCP (HTTP '.$response->status().').');
        }

        $docs = $response->json();
        if (! is_array($docs) || $docs === []) {
            throw new RuntimeException('Nenhum documento encontrado no PNCP.');
        }

        $chosen = $this->pickPncpDocument($docs);
        if ($chosen === null) {
            throw new RuntimeException('Nenhum PDF de edital/aviso encontrado no PNCP.');
        }

        $url = (string) ($chosen['url'] ?? $chosen['uri'] ?? '');
        $filename = (string) ($chosen['titulo'] ?? sprintf(
            'edital-pncp-%s-%d-%d.pdf',
            $parsed['cnpj'],
            $parsed['ano'],
            $parsed['sequencial'],
        ));
        if ($url === '') {
            throw new RuntimeException('Documento PNCP sem URL de download.');
        }

        if (! str_ends_with(mb_strtolower($filename), '.pdf')) {
            $filename .= '.pdf';
        }

        return $this->downloadFile($url, $filename);
    }

    /**
     * @param  list<array<string, mixed>>  $docs
     * @return array<string, mixed>|null
     */
    private function pickPncpDocument(array $docs): ?array
    {
        $pdfs = [];
        foreach ($docs as $doc) {
            if (! is_array($doc)) {
                continue;
            }
            $titulo = (string) ($doc['titulo'] ?? '');
            $tipo = mb_strtolower((string) ($doc['tipoDocumentoNome'] ?? ''));
            $tipoId = (int) ($doc['tipoDocumentoId'] ?? 0);
            $haystack = mb_strtolower($titulo.' '.$tipo);

            // PNCP às vezes omite extensão; evita docx/odt explícitos
            if (preg_match('/\.(docx?|odt|xlsx?|zip|rar)(\?|$)/i', $titulo)) {
                continue;
            }

            $pdfs[] = [
                'doc' => $doc,
                'tipo_id' => $tipoId,
                'score' => match (true) {
                    $tipoId === 2 || str_contains($haystack, 'edital') => 100,
                    $tipoId === 1 || str_contains($haystack, 'aviso') => 80,
                    $tipoId === 4 || str_contains($haystack, 'termo de referência') || str_contains($haystack, 'termo de referencia') => 40,
                    default => 10,
                },
            ];
        }

        if ($pdfs === []) {
            return null;
        }

        usort($pdfs, fn ($a, $b) => $b['score'] <=> $a['score']);

        return $pdfs[0]['doc'];
    }

    /**
     * @return array{contents: string, filename: string, mime: string, source_url: string}
     */
    private function fetchFromPcp(AlertaOpportunity $opportunity): array
    {
        $link = (string) $opportunity->linkProcesso;
        $id = $this->urls->extractPcpLicitacaoId($link);
        if ($id === null) {
            throw new RuntimeException('Não foi possível identificar o código da licitação no Portal de Compras Públicas.');
        }

        $response = $this->http()->get(
            "https://compras.api.portaldecompraspublicas.com.br/v2/licitacao/{$id}/documentos/processo"
        );

        if (! $response->successful()) {
            throw new RuntimeException('Falha ao listar documentos no Portal de Compras Públicas (HTTP '.$response->status().').');
        }

        $docs = $response->json();
        if (! is_array($docs) || $docs === []) {
            throw new RuntimeException('Nenhum documento encontrado no Portal de Compras Públicas.');
        }

        $edital = null;
        foreach ($docs as $doc) {
            if (! is_array($doc)) {
                continue;
            }
            $tipo = mb_strtolower((string) ($doc['tipo'] ?? ''));
            $nome = (string) ($doc['nome'] ?? '');
            if ($tipo === 'edital' || str_contains(mb_strtolower($nome), 'edital')) {
                $edital = $doc;
                break;
            }
        }
        $edital ??= $docs[0];

        $url = (string) ($edital['url'] ?? '');
        $filename = (string) ($edital['nome'] ?? "edital-pcp-{$id}.pdf");
        if ($url === '') {
            throw new RuntimeException('Documento do edital sem URL de download.');
        }

        return $this->downloadFile($url, $filename);
    }

    /**
     * @return array{contents: string, filename: string, mime: string, source_url: string}
     */
    private function fetchFromBll(AlertaOpportunity $opportunity): array
    {
        $link = (string) $opportunity->linkProcesso;
        if ($link === '') {
            throw new RuntimeException('Oportunidade BLL sem link do processo.');
        }

        $page = $this->http()->get($link);
        if (! $page->successful()) {
            throw new RuntimeException('Falha ao abrir processo na BLL (HTTP '.$page->status().').');
        }

        $html = $page->body();
        if (! preg_match("/ProcessFiles',\s*\['([^']+)'\]/", $html, $m)) {
            throw new RuntimeException('Não foi possível localizar a lista de arquivos do processo BLL.');
        }

        $filesParam = $m[1];
        $filesResponse = $this->http()
            ->withHeaders(['X-Requested-With' => 'XMLHttpRequest'])
            ->get('https://bllcompras.com/Process/ProcessFiles', [
                'param1' => $filesParam,
            ]);

        if (! $filesResponse->successful()) {
            throw new RuntimeException('Falha ao listar arquivos na BLL (HTTP '.$filesResponse->status().').');
        }

        $payload = $filesResponse->json();
        $filesHtml = is_array($payload) ? (string) ($payload['html'] ?? '') : $filesResponse->body();
        if ($filesHtml === '') {
            throw new RuntimeException('Lista de arquivos BLL vazia.');
        }

        if (! preg_match_all('/href="(https:\/\/lanceeletronico\.blob\.core\.windows\.net\/processfiles\/[^"]+\.pdf)"[^>]*download="([^"]+)"/i', $filesHtml, $matches, PREG_SET_ORDER)) {
            if (! preg_match_all('/href="(https:\/\/lanceeletronico\.blob\.core\.windows\.net\/processfiles\/[^"]+\.pdf)"/i', $filesHtml, $loose, PREG_SET_ORDER)) {
                throw new RuntimeException('Nenhum PDF encontrado nos arquivos do processo BLL.');
            }
            $matches = array_map(fn ($row) => [$row[0], $row[1], basename(parse_url($row[1], PHP_URL_PATH) ?: 'edital.pdf')], $loose);
        }

        $chosen = null;
        foreach ($matches as $match) {
            $name = html_entity_decode($match[2], ENT_QUOTES | ENT_HTML5);
            if (preg_match('/edital/i', $name)) {
                $chosen = ['url' => $match[1], 'name' => $name];
                break;
            }
        }
        $chosen ??= [
            'url' => $matches[0][1],
            'name' => html_entity_decode($matches[0][2], ENT_QUOTES | ENT_HTML5),
        ];

        return $this->downloadFile($chosen['url'], $chosen['name']);
    }

    /**
     * @return array{contents: string, filename: string, mime: string, source_url: string}
     */
    private function downloadFile(string $url, string $filename): array
    {
        $response = $this->http()->get($url);
        if (! $response->successful()) {
            throw new RuntimeException('Falha ao baixar PDF do edital (HTTP '.$response->status().').');
        }

        $contents = $response->body();
        if ($contents === '' || ! str_starts_with($contents, '%PDF')) {
            throw new RuntimeException('Arquivo baixado não é um PDF válido.');
        }

        $filename = $this->sanitizeFilename($filename);

        return [
            'contents' => $contents,
            'filename' => $filename,
            'mime' => 'application/pdf',
            'source_url' => $url,
        ];
    }

    private function http()
    {
        return Http::timeout((int) config('edital_alerta.http_timeout', 60))
            ->withHeaders([
                'User-Agent' => (string) config('edital_alerta.http_user_agent'),
                'Accept' => 'application/json,text/html,*/*',
            ])
            ->withOptions(['allow_redirects' => true]);
    }

    private function sanitizeFilename(string $filename): string
    {
        $filename = basename(str_replace(["\0", '\\'], '', $filename));
        $filename = preg_replace('/[^\w\s\.\-\(\)\[\]]+/u', '_', $filename) ?? 'edital.pdf';
        if (! str_ends_with(mb_strtolower($filename), '.pdf')) {
            $filename .= '.pdf';
        }

        return $filename;
    }
}
