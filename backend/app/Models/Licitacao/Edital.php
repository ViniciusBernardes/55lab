<?php

namespace App\Models\Licitacao;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Edital extends Model
{
    protected $table = 'editais';

    protected $fillable = [
        'titulo',
        'numero',
        'orgao',
        'modalidade',
        'objeto',
        'valor_estimado',
        'data_abertura',
        'data_encerramento',
        'status',
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
        ];
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
