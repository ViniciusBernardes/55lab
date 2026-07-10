<?php

namespace App\Services\Assinatura;

use RuntimeException;
use SignerPHP\Application\DTO\SignatureActorDto;
use SignerPHP\Application\DTO\SignatureMetadataDto;
use SignerPHP\Domain\Exception\SignerException;
use SignerPHP\Presentation\Signer;
use Throwable;

class PdfSignerService
{
    /**
     * Assina o PDF embutindo assinatura PAdES Baseline-B (ETSI.CAdES.detached),
     * reconhecível pelo Validador ITI.
     *
     * @param  array{name?: string, reason?: string, location?: string, contact?: string}  $meta
     */
    public function signPdf(
        string $pdfContent,
        string $pfxContent,
        string $password,
        array $meta = [],
    ): string {
        if ($pdfContent === '') {
            throw new RuntimeException('Conteúdo do PDF está vazio.');
        }

        if ($pfxContent === '') {
            throw new RuntimeException('Conteúdo do certificado PFX está vazio.');
        }

        $metadata = new SignatureMetadataDto(
            reason: $meta['reason'] ?? 'Assinatura digital ICP-Brasil',
            location: $meta['location'] ?? 'Brasil',
            actor: new SignatureActorDto(
                name: $meta['name'] ?? 'Signatário',
                contactInfo: $meta['contact'] ?? null,
            ),
        );

        try {
            return Signer::signer()
                ->withPdfContent($pdfContent)
                ->withCertificateContent($pfxContent, $password)
                ->withMetadata($metadata)
                ->withPadesBaselineB()
                ->withoutDefaultAppearance()
                ->sign();
        } catch (SignerException $e) {
            throw new RuntimeException('Falha ao assinar o PDF: '.$e->getMessage(), 0, $e);
        } catch (Throwable $e) {
            throw new RuntimeException(
                'Falha inesperada ao assinar o PDF: '.$e->getMessage(),
                0,
                $e,
            );
        }
    }

    /**
     * Verifica se o PDF contém ao menos uma assinatura digital embutida.
     */
    public function hasEmbeddedSignature(string $pdfContent): bool
    {
        return str_contains($pdfContent, '/Type /Sig')
            || str_contains($pdfContent, '/Type/Sig')
            || str_contains($pdfContent, '/ByteRange');
    }
}
