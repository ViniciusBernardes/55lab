<?php

namespace App\Models\Assinatura;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Crypt;

class CertificadoDigital extends Model
{
    protected $table = 'certificados_digitais';

    protected $fillable = [
        'user_id',
        'apelido',
        'titular_nome',
        'titular_cpf_mascarado',
        'emissor_certificado',
        'validade_certificado',
        'icp_brasil',
        'arquivo_pfx_encrypted',
        'senha_encrypted',
        'is_padrao',
        'is_active',
    ];

    protected $hidden = [
        'arquivo_pfx_encrypted',
        'senha_encrypted',
    ];

    protected function casts(): array
    {
        return [
            'validade_certificado' => 'date',
            'icp_brasil' => 'boolean',
            'is_padrao' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function setPfxContent(string $content): void
    {
        $this->attributes['arquivo_pfx_encrypted'] = Crypt::encryptString(base64_encode($content));
    }

    public function getPfxContent(): ?string
    {
        if (blank($this->arquivo_pfx_encrypted)) {
            return null;
        }

        try {
            return base64_decode(Crypt::decryptString($this->arquivo_pfx_encrypted), true) ?: null;
        } catch (\Throwable) {
            return null;
        }
    }

    public function setSenhaCertificado(string $senha): void
    {
        $this->attributes['senha_encrypted'] = Crypt::encryptString($senha);
    }

    public function getSenhaCertificado(): ?string
    {
        if (blank($this->senha_encrypted)) {
            return null;
        }

        try {
            return Crypt::decryptString($this->senha_encrypted);
        } catch (\Throwable) {
            return null;
        }
    }

    public function isValido(): bool
    {
        if (! $this->validade_certificado) {
            return $this->is_active;
        }

        return $this->is_active && $this->validade_certificado->isFuture();
    }

    public function toPublicArray(): array
    {
        return [
            'id' => $this->id,
            'apelido' => $this->apelido,
            'titular_nome' => $this->titular_nome,
            'titular_cpf_mascarado' => $this->titular_cpf_mascarado,
            'emissor_certificado' => $this->emissor_certificado,
            'validade_certificado' => $this->validade_certificado?->format('Y-m-d'),
            'icp_brasil' => $this->icp_brasil,
            'is_padrao' => $this->is_padrao,
            'is_active' => $this->is_active,
            'is_valido' => $this->isValido(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
