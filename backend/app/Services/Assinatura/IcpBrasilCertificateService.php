<?php

namespace App\Services\Assinatura;

use RuntimeException;

class IcpBrasilCertificateService
{
    private const CPF_OID = '2.16.76.1.3.1';

    /**
     * @return array{
     *     nome: string,
     *     cpf: string,
     *     cpf_mascarado: string,
     *     emissor: string,
     *     cadeia: string,
     *     serial: string,
     *     validade: string,
     *     icp_brasil: bool,
     *     cert_path: string,
     *     key_path: string,
     *     extra_certs_path: string|null
     * }
     */
    public function parsePfx(string $pfxContent, string $password): array
    {
        $certs = [];
        if (! openssl_pkcs12_read($pfxContent, $certs, $password)) {
            throw new RuntimeException('Não foi possível ler o certificado. Verifique o arquivo e a senha.');
        }

        $certPem = $certs['cert'] ?? null;
        $keyPem = $certs['pkey'] ?? null;

        if (! $certPem || ! $keyPem) {
            throw new RuntimeException('Certificado ou chave privada ausentes no arquivo PFX.');
        }

        $parsed = openssl_x509_parse($certPem);
        if ($parsed === false) {
            throw new RuntimeException('Não foi possível interpretar o certificado X.509.');
        }

        $nome = $this->extractName($parsed);
        $cpf = $this->extractCpf($parsed, $certPem);
        $emissor = $this->formatDn($parsed['issuer'] ?? []);
        $cadeia = $this->buildCertificateChain($certPem, $certs['extracerts'] ?? []);
        $validade = date('Y-m-d', $parsed['validTo_time_t'] ?? time());
        $serial = $this->formatSerial($parsed['serialNumber'] ?? '');

        $tempDir = $this->createTempDir();
        $certPath = "{$tempDir}/cert.pem";
        $keyPath = "{$tempDir}/key.pem";
        file_put_contents($certPath, $certPem);
        file_put_contents($keyPath, $keyPem);

        $extraCertsPath = null;
        if (! empty($certs['extracerts'])) {
            $extraCertsPath = "{$tempDir}/chain.pem";
            file_put_contents($extraCertsPath, implode("\n", $certs['extracerts']));
        }

        return [
            'nome' => $nome,
            'cpf' => $cpf,
            'cpf_mascarado' => $this->maskCpf($cpf),
            'emissor' => $emissor,
            'cadeia' => $cadeia,
            'serial' => $serial,
            'validade' => $validade,
            'icp_brasil' => $this->isIcpBrasil($parsed, $cadeia),
            'cert_path' => $certPath,
            'key_path' => $keyPath,
            'extra_certs_path' => $extraCertsPath,
            'temp_dir' => $tempDir,
        ];
    }

    public function maskCpf(string $cpf): string
    {
        $digits = preg_replace('/\D/', '', $cpf);

        if (strlen($digits) !== 11) {
            return $cpf ?: 'N/A';
        }

        return sprintf(
            '%s.%s.%s-%s',
            substr($digits, 0, 3),
            'XXX',
            'XXX',
            substr($digits, -2),
        );
    }

    public function cleanupTempDir(?string $tempDir): void
    {
        if (! $tempDir || ! is_dir($tempDir)) {
            return;
        }

        foreach (glob("{$tempDir}/*") ?: [] as $file) {
            @unlink($file);
        }
        @rmdir($tempDir);
    }

    private function extractName(array $parsed): string
    {
        $subject = $parsed['subject'] ?? [];

        if (! empty($subject['CN'])) {
            return $this->cleanName($subject['CN']);
        }

        return $subject['O'] ?? $subject['OU'] ?? 'Signatário';
    }

    private function cleanName(string $cn): string
    {
        $name = preg_replace('/:\d{11}$/', '', $cn) ?? $cn;

        return trim($name);
    }

    private function extractCpf(array $parsed, string $certPem): string
    {
        $extensions = $parsed['extensions'] ?? [];

        if (isset($extensions['subjectAltName'])) {
            if (preg_match('/(\d{11})/', $extensions['subjectAltName'], $matches)) {
                return $matches[1];
            }
        }

        $subject = $parsed['subject'] ?? [];
        if (! empty($subject['CN']) && preg_match('/:(\d{11})$/', $subject['CN'], $matches)) {
            return $matches[1];
        }

        if (preg_match('/'.preg_quote(self::CPF_OID, '/').'[^\d]*(\d{11})/', $certPem, $matches)) {
            return $matches[1];
        }

        return '';
    }

    private function formatDn(array $dn): string
    {
        $parts = [];
        foreach (['CN', 'OU', 'O'] as $key) {
            if (! empty($dn[$key])) {
                $parts[] = $dn[$key];
            }
        }

        return implode(', ', $parts) ?: 'Emissor desconhecido';
    }

    private function buildCertificateChain(string $certPem, array $extraCerts): string
    {
        $chain = [];

        $parsed = openssl_x509_parse($certPem);
        if ($parsed) {
            $chain[] = $this->formatDn($parsed['issuer'] ?? []);
        }

        foreach ($extraCerts as $extraCert) {
            $extraParsed = openssl_x509_parse($extraCert);
            if ($extraParsed) {
                $chain[] = $this->formatDn($extraParsed['subject'] ?? []);
            }
        }

        return implode(' << ', array_unique($chain));
    }

    private function isIcpBrasil(array $parsed, string $cadeia): bool
    {
        $issuer = strtolower($this->formatDn($parsed['issuer'] ?? []));
        $cadeiaLower = strtolower($cadeia);

        $icpIndicators = [
            'icp-brasil',
            'icp brasil',
            'autoridade certificadora raiz brasileira',
            'ac ',
            'receita federal',
            'serpro',
            'certisign',
            'valid',
            'safeweb',
            'soluti',
        ];

        foreach ($icpIndicators as $indicator) {
            if (str_contains($issuer, $indicator) || str_contains($cadeiaLower, $indicator)) {
                return true;
            }
        }

        return false;
    }

    private function formatSerial(string $serial): string
    {
        if ($serial === '') {
            return '';
        }

        if (str_starts_with(strtolower($serial), '0x')) {
            return strtoupper($serial);
        }

        return strtoupper(dechex((int) $serial));
    }

    private function createTempDir(): string
    {
        $dir = sys_get_temp_dir().'/icp_'.bin2hex(random_bytes(8));
        if (! mkdir($dir, 0700, true) && ! is_dir($dir)) {
            throw new RuntimeException('Não foi possível criar diretório temporário.');
        }

        return $dir;
    }
}
