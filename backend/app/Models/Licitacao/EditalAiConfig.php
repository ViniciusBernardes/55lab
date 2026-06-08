<?php

namespace App\Models\Licitacao;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EditalAiConfig extends Model
{
    protected $table = 'edital_ai_configs';

    protected $fillable = [
        'edital_id',
        'enabled',
        'provider',
        'model',
        'system_prompt',
        'extraction_schema',
        'require_review',
        'auto_analyze_on_upload',
    ];

    protected function casts(): array
    {
        return [
            'enabled' => 'boolean',
            'extraction_schema' => 'array',
            'require_review' => 'boolean',
            'auto_analyze_on_upload' => 'boolean',
        ];
    }

    public function edital(): BelongsTo
    {
        return $this->belongsTo(Edital::class);
    }
}
