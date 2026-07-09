<?php

namespace App\Services\Assinatura;

use App\Models\Assinatura\CertificadoDigital;
use Illuminate\Http\UploadedFile;
use RuntimeException;

class CertificadoDigitalService
{
    public function __construct(
        private readonly IcpBrasilCertificateService $certificateService,
    ) {}

    public function listForUser(int $userId): array
    {
        return CertificadoDigital::query()
            ->where('user_id', $userId)
            ->where('is_active', true)
            ->orderByDesc('is_padrao')
            ->orderBy('apelido')
            ->get()
            ->map(fn (CertificadoDigital $c) => $c->toPublicArray())
            ->all();
    }

    public function store(
        int $userId,
        UploadedFile $arquivo,
        string $senha,
        string $apelido,
        bool $isPadrao = false,
    ): CertificadoDigital {
        $pfxContent = file_get_contents($arquivo->getRealPath());
        if ($pfxContent === false) {
            throw new RuntimeException('Não foi possível ler o certificado.');
        }

        $certInfo = $this->certificateService->parsePfx($pfxContent, $senha);
        $tempDir = $certInfo['temp_dir'] ?? null;

        try {
            if ($isPadrao) {
                $this->clearPadrao($userId);
            }

            $certificado = new CertificadoDigital([
                'user_id' => $userId,
                'apelido' => $apelido,
                'titular_nome' => $certInfo['nome'],
                'titular_cpf_mascarado' => $certInfo['cpf_mascarado'],
                'emissor_certificado' => $certInfo['emissor'],
                'validade_certificado' => $certInfo['validade'],
                'icp_brasil' => $certInfo['icp_brasil'],
                'is_padrao' => $isPadrao,
                'is_active' => true,
            ]);
            $certificado->setPfxContent($pfxContent);
            $certificado->setSenhaCertificado($senha);
            $certificado->save();

            if (! CertificadoDigital::query()->where('user_id', $userId)->where('is_padrao', true)->exists()) {
                $certificado->update(['is_padrao' => true]);
            }

            return $certificado->fresh();
        } finally {
            $this->certificateService->cleanupTempDir($tempDir);
        }
    }

    public function destroy(CertificadoDigital $certificado): void
    {
        $certificado->delete();
    }

    public function setPadrao(CertificadoDigital $certificado): CertificadoDigital
    {
        $this->clearPadrao($certificado->user_id);
        $certificado->update(['is_padrao' => true]);

        return $certificado->fresh();
    }

    /**
     * @return array{pfx: string, senha: string, certificado: CertificadoDigital}
     */
    public function resolveForSigning(int $userId, int $certificadoId, ?string $senha = null): array
    {
        $certificado = CertificadoDigital::query()
            ->where('user_id', $userId)
            ->where('id', $certificadoId)
            ->where('is_active', true)
            ->first();

        if (! $certificado) {
            throw new RuntimeException('Certificado digital não encontrado.');
        }

        if (! $certificado->isValido()) {
            throw new RuntimeException('O certificado selecionado está expirado ou inativo.');
        }

        $pfx = $certificado->getPfxContent();
        $storedSenha = $certificado->getSenhaCertificado();

        if (! $pfx || ! $storedSenha) {
            throw new RuntimeException('Não foi possível acessar os dados do certificado. Cadastre-o novamente.');
        }

        if ($senha !== null && $senha !== '' && $senha !== $storedSenha) {
            throw new RuntimeException('Senha do certificado incorreta.');
        }

        return [
            'pfx' => $pfx,
            'senha' => $storedSenha,
            'certificado' => $certificado,
        ];
    }

    private function clearPadrao(int $userId): void
    {
        CertificadoDigital::query()
            ->where('user_id', $userId)
            ->update(['is_padrao' => false]);
    }
}
