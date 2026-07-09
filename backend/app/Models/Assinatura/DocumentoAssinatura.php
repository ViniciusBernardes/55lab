<?php

namespace App\Models\Assinatura;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DocumentoAssinatura extends Model
{
    protected $table = 'documentos_assinatura';

    protected $fillable = [
        'user_id',
        'titulo',
        'codigo_verificacao',
        'hash_documento',
        'arquivo_original_path',
        'arquivo_original_nome',
        'arquivo_original_tamanho',
        'arquivo_assinado_path',
        'arquivo_assinado_tamanho',
        'status',
    ];

    protected $appends = [
        'url_verificacao',
    ];

    protected function casts(): array
    {
        return [
            'arquivo_original_tamanho' => 'integer',
            'arquivo_assinado_tamanho' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function assinaturas(): HasMany
    {
        return $this->hasMany(AssinaturaDocumento::class)->orderBy('assinado_em');
    }

    public function isAssinado(): bool
    {
        return $this->status === 'assinado';
    }

    public function getUrlVerificacaoAttribute(): string
    {
        $frontendUrl = rtrim((string) config('assinatura.frontend_url'), '/');

        return "{$frontendUrl}/verificacao/{$this->codigo_verificacao}";
    }
}
