<?php

namespace App\Services\Assinatura;

use RuntimeException;

class PdfSignerService
{
    /**
     * Assina o conteúdo do documento com PKCS#7 (padrão CMS) usando certificado ICP-Brasil A1.
     */
    public function sign(
        string $documentPath,
        string $certPath,
        string $keyPath,
        ?string $extraCertsPath = null,
    ): string {
        if (! file_exists($documentPath)) {
            throw new RuntimeException('Arquivo do documento não encontrado.');
        }

        $outputDir = sys_get_temp_dir().'/pkcs7_'.bin2hex(random_bytes(8));
        if (! mkdir($outputDir, 0700, true) && ! is_dir($outputDir)) {
            throw new RuntimeException('Não foi possível criar diretório temporário para assinatura.');
        }

        $signaturePath = "{$outputDir}/signature.p7s";

        $flags = PKCS7_DETACHED | PKCS7_BINARY;
        $extraCerts = $extraCertsPath && file_exists($extraCertsPath) ? $extraCertsPath : null;

        $success = openssl_pkcs7_sign(
            $documentPath,
            $signaturePath,
            "file://{$certPath}",
            ["file://{$keyPath}", ''],
            [],
            $flags,
            $extraCerts,
        );

        if (! $success) {
            $this->cleanupDir($outputDir);
            throw new RuntimeException('Falha ao assinar o documento: '.openssl_error_string());
        }

        $signatureContent = file_get_contents($signaturePath);
        if ($signatureContent === false) {
            $this->cleanupDir($outputDir);
            throw new RuntimeException('Não foi possível ler a assinatura gerada.');
        }

        $this->cleanupDir($outputDir);

        return $signatureContent;
    }

    public function verify(string $documentPath, string $signaturePath): bool
    {
        if (! file_exists($documentPath) || ! file_exists($signaturePath)) {
            return false;
        }

        $certs = [];
        $result = openssl_pkcs7_verify(
            $documentPath,
            PKCS7_NOVERIFY,
            $signaturePath,
            [],
            $certs,
        );

        return $result === true || $result === 1;
    }

    private function cleanupDir(string $dir): void
    {
        foreach (glob("{$dir}/*") ?: [] as $file) {
            @unlink($file);
        }
        @rmdir($dir);
    }
}
