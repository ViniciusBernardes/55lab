<?php

namespace App\Models\Assinatura;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssinaturaDocumento extends Model
{
    protected $table = 'assinaturas_documento';

    protected $fillable = [
        'documento_assinatura_id',
        'signatario_nome',
        'signatario_cpf_mascarado',
        'signatario_papel',
        'assinado_em',
        'cadeia_certificadora',
        'emissor_certificado',
        'serial_certificado',
        'validade_certificado',
        'icp_brasil',
        'assinatura_pkcs7_path',
    ];

    protected function casts(): array
    {
        return [
            'assinado_em' => 'datetime',
            'validade_certificado' => 'date',
            'icp_brasil' => 'boolean',
        ];
    }

    public function documento(): BelongsTo
    {
        return $this->belongsTo(DocumentoAssinatura::class, 'documento_assinatura_id');
    }
}
