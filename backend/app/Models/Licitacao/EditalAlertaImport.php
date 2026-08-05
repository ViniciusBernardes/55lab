<?php

namespace App\Models\Licitacao;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EditalAlertaImport extends Model
{
    protected $table = 'edital_alerta_imports';

    protected $fillable = [
        'fonte',
        'status',
        'arquivo_path',
        'arquivo_nome_original',
        'segmentos',
        'total_encontrados',
        'total_filtrados',
        'total_importados',
        'total_erros',
        'resultado',
        'error_message',
    ];

    protected function casts(): array
    {
        return [
            'segmentos' => 'array',
            'resultado' => 'array',
            'total_encontrados' => 'integer',
            'total_filtrados' => 'integer',
            'total_importados' => 'integer',
            'total_erros' => 'integer',
        ];
    }

    public function editais(): HasMany
    {
        return $this->hasMany(Edital::class, 'alerta_import_id');
    }
}
