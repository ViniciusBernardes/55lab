<?php

namespace App\Models\Licitacao;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Edital extends Model
{
    protected $table = 'editais';

    protected $fillable = [
        'alerta_import_id',
        'titulo',
        'numero',
        'orgao',
        'modalidade',
        'segmento',
        'fonte',
        'link_origem',
        'objeto',
        'valor_estimado',
        'data_abertura',
        'hora_abertura',
        'data_encerramento',
        'status',
        'destacado',
        'arquivo_path',
        'arquivo_nome_original',
        'arquivo_mime',
        'arquivo_tamanho',
        'observacoes',
    ];

    protected function casts(): array
    {
        return [
            'valor_estimado' => 'decimal:2',
            'data_abertura' => 'date',
            'data_encerramento' => 'date',
            'arquivo_tamanho' => 'integer',
            'destacado' => 'boolean',
        ];
    }

    public function alertaImport(): BelongsTo
    {
        return $this->belongsTo(EditalAlertaImport::class, 'alerta_import_id');
    }

    public function aiConfig(): HasOne
    {
        return $this->hasOne(EditalAiConfig::class);
    }

    public function analises(): HasMany
    {
        return $this->hasMany(EditalAnalise::class)->latest();
    }

    public function ultimaAnalise(): HasOne
    {
        return $this->hasOne(EditalAnalise::class)->latestOfMany();
    }

    public function hasArquivo(): bool
    {
        return filled($this->arquivo_path);
    }
}
