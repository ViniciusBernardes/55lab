<?php

namespace App\Services\Licitacao\Alerta;

class AlertaUrlHelper
{
    public function unwrapTrackingUrl(string $url): string
    {
        if (preg_match('#/L0/(https?[^/]+(?:/[^/]+)*)/\d+/#i', $url, $matches)) {
            return urldecode($matches[1]);
        }

        if (preg_match('#/L0/(https?%3A[^/]+(?:/[^/]+)*)/\d+/#i', $url, $matches)) {
            return urldecode($matches[1]);
        }

        return $url;
    }

    public function normalizeProcessUrl(string $url): string
    {
        $url = $this->unwrapTrackingUrl($url);
        $parts = parse_url($url);
        if (! is_array($parts) || empty($parts['scheme']) || empty($parts['host'])) {
            return $url;
        }

        $path = $parts['path'] ?? '';
        $query = isset($parts['query']) ? '?'.$parts['query'] : '';

        return strtolower($parts['scheme']).'://'.strtolower($parts['host']).$path.$query;
    }

    public function isPortalComprasPublicas(string $url): bool
    {
        $url = strtolower($this->unwrapTrackingUrl($url));
        $host = parse_url($url, PHP_URL_HOST) ?: '';

        if (! str_contains($host, 'portaldecompraspublicas.com.br')) {
            return false;
        }

        return str_contains($url, '/processos/');
    }

    public function isBll(string $url): bool
    {
        $url = $this->unwrapTrackingUrl($url);

        return str_contains(strtolower($url), 'bllcompras.com')
            && str_contains(strtolower($url), 'processview');
    }

    public function extractPcpLicitacaoId(string $url): ?int
    {
        $url = $this->unwrapTrackingUrl($url);
        if (preg_match('#-(\d{4,})/?(\?|$)#', $url, $matches)) {
            return (int) $matches[1];
        }

        return null;
    }

    /**
     * @return array{cnpj: string, unidade: int, sequencial: int, ano: int}|null
     */
    public function parsePncpControle(string $controle): ?array
    {
        $controle = trim($controle);
        if (! preg_match('/^(\d{14})-(\d+)-(\d+)\/(\d{4})$/', $controle, $matches)) {
            return null;
        }

        return [
            'cnpj' => $matches[1],
            'unidade' => (int) $matches[2],
            'sequencial' => (int) $matches[3],
            'ano' => (int) $matches[4],
        ];
    }

    public function pncpEditalUrl(string $cnpj, int $ano, int $sequencial): string
    {
        return "https://pncp.gov.br/app/editais/{$cnpj}/{$ano}/{$sequencial}";
    }
}
