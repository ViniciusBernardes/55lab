<?php

namespace App\Services\Assinatura;

use App\Models\Assinatura\AssinaturaDocumento;
use App\Models\Assinatura\DocumentoAssinatura;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class DocumentoAssinaturaService
{
    public function __construct(
        private readonly IcpBrasilCertificateService $certificateService,
        private readonly PdfSignerService $pdfSignerService,
        private readonly VerificationPageService $verificationPageService,
    ) {}

    public function generateCodigoVerificacao(): string
    {
        $segments = [];
        for ($i = 0; $i < 4; $i++) {
            $segments[] = strtoupper(bin2hex(random_bytes(2)));
        }

        return implode('-', $segments);
    }

    public function upload(UploadedFile $file, string $titulo, int $userId): DocumentoAssinatura
    {
        $content = file_get_contents($file->getRealPath());
        if ($content === false) {
            throw new RuntimeException('Não foi possível ler o arquivo enviado.');
        }

        $hash = hash('sha256', $content);
        $path = $file->store('assinatura/originais', 'local');

        return DocumentoAssinatura::create([
            'user_id' => $userId,
            'titulo' => $titulo,
            'codigo_verificacao' => $this->generateUniqueCodigo(),
            'hash_documento' => $hash,
            'arquivo_original_path' => $path,
            'arquivo_original_nome' => $file->getClientOriginalName(),
            'arquivo_original_tamanho' => $file->getSize(),
            'status' => 'pendente',
        ]);
    }

    public function assinar(
        DocumentoAssinatura $documento,
        UploadedFile $certificado,
        string $senha,
        string $papel = 'Parte',
    ): DocumentoAssinatura {
        $pfxContent = file_get_contents($certificado->getRealPath());
        if ($pfxContent === false) {
            throw new RuntimeException('Não foi possível ler o certificado.');
        }

        return $this->assinarComPfx($documento, $pfxContent, $senha, $papel);
    }

    public function assinarComPfx(
        DocumentoAssinatura $documento,
        string $pfxContent,
        string $senha,
        string $papel = 'Parte',
    ): DocumentoAssinatura {
        $certInfo = $this->certificateService->parsePfx($pfxContent, $senha);
        $tempDir = $certInfo['temp_dir'] ?? null;

        try {
            return DB::transaction(function () use ($documento, $certInfo, $papel, $pfxContent, $senha) {
                $originalPath = Storage::disk('local')->path($documento->arquivo_original_path);
                $assinadoEm = now();

                $signatarioData = [
                    'nome' => $certInfo['nome'],
                    'cpf_mascarado' => $certInfo['cpf_mascarado'],
                    'papel' => $papel,
                    'assinado_em' => $assinadoEm->format('d/m/Y H:i:s').' GMT'.$assinadoEm->format('P'),
                    'cadeia' => $certInfo['cadeia'],
                    'icp_brasil' => $certInfo['icp_brasil'],
                ];

                $existingSignatures = $documento->assinaturas->map(fn ($a) => [
                    'nome' => $a->signatario_nome,
                    'cpf_mascarado' => $a->signatario_cpf_mascarado,
                    'papel' => $a->signatario_papel,
                    'assinado_em' => $a->assinado_em->format('d/m/Y H:i:s').' GMT'.$a->assinado_em->format('P'),
                    'cadeia' => $a->cadeia_certificadora,
                    'icp_brasil' => $a->icp_brasil,
                ])->toArray();

                $allSignatarios = array_merge($existingSignatures, [$signatarioData]);

                // 1) Monta o PDF visual (tarja + página de verificação)
                $visualPdfPath = sys_get_temp_dir().'/visual_'.bin2hex(random_bytes(8)).'.pdf';
                $this->verificationPageService->appendToPdf(
                    $originalPath,
                    $visualPdfPath,
                    $documento->codigo_verificacao,
                    $documento->url_verificacao,
                    $allSignatarios,
                );

                $visualContent = file_get_contents($visualPdfPath);
                @unlink($visualPdfPath);

                if ($visualContent === false || $visualContent === '') {
                    throw new RuntimeException('Não foi possível gerar o PDF visual para assinatura.');
                }

                // 2) Embute assinatura PAdES no PDF (exigido pelo Validador ITI)
                $signedPdfContent = $this->pdfSignerService->signPdf(
                    $visualContent,
                    $pfxContent,
                    $senha,
                    [
                        'name' => $certInfo['nome'],
                        'reason' => 'Assinatura digital ICP-Brasil',
                        'location' => 'Brasil',
                    ],
                );

                if (! $this->pdfSignerService->hasEmbeddedSignature($signedPdfContent)) {
                    throw new RuntimeException('A assinatura digital não foi embutida corretamente no PDF.');
                }

                $storagePath = "assinatura/assinados/{$documento->id}_".time().'.pdf';
                Storage::disk('local')->put($storagePath, $signedPdfContent);

                AssinaturaDocumento::create([
                    'documento_assinatura_id' => $documento->id,
                    'signatario_nome' => $certInfo['nome'],
                    'signatario_cpf_mascarado' => $certInfo['cpf_mascarado'],
                    'signatario_papel' => $papel,
                    'assinado_em' => $assinadoEm,
                    'cadeia_certificadora' => $certInfo['cadeia'],
                    'emissor_certificado' => $certInfo['emissor'],
                    'serial_certificado' => $certInfo['serial'],
                    'validade_certificado' => $certInfo['validade'],
                    'icp_brasil' => $certInfo['icp_brasil'],
                    'assinatura_pkcs7_path' => null,
                ]);

                $documento->update([
                    'arquivo_assinado_path' => $storagePath,
                    'arquivo_assinado_tamanho' => Storage::disk('local')->size($storagePath),
                    'status' => 'assinado',
                ]);

                return $documento->fresh()->load('assinaturas');
            });
        } finally {
            $this->certificateService->cleanupTempDir($tempDir);
        }
    }

    public function verificar(string $codigo): ?array
    {
        $documento = DocumentoAssinatura::query()
            ->where('codigo_verificacao', strtoupper($codigo))
            ->with('assinaturas')
            ->first();

        if (! $documento) {
            return null;
        }

        $integridadeOk = true;
        if ($documento->arquivo_assinado_path) {
            $content = Storage::disk('local')->get($documento->arquivo_assinado_path);
            $integridadeOk = $content !== null && hash('sha256', $content) !== ''
                && $documento->isAssinado();
        }

        return [
            'codigo_verificacao' => $documento->codigo_verificacao,
            'titulo' => $documento->titulo,
            'status' => $documento->status,
            'integridade_ok' => $integridadeOk,
            'url_verificacao' => $documento->url_verificacao,
            'assinaturas' => $documento->assinaturas->map(fn ($a) => [
                'nome' => $a->signatario_nome,
                'cpf_mascarado' => $a->signatario_cpf_mascarado,
                'papel' => $a->signatario_papel,
                'assinado_em' => $a->assinado_em->format('d/m/Y H:i:s').' GMT'.$a->assinado_em->format('P'),
                'cadeia_certificadora' => $a->cadeia_certificadora,
                'icp_brasil' => $a->icp_brasil,
            ]),
            'criado_em' => $documento->created_at?->toIso8601String(),
        ];
    }

    private function generateUniqueCodigo(): string
    {
        do {
            $codigo = $this->generateCodigoVerificacao();
        } while (DocumentoAssinatura::query()->where('codigo_verificacao', $codigo)->exists());

        return $codigo;
    }
}
