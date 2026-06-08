<?php

namespace App\Models\Licitacao;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EditalAnalise extends Model
{
    protected $table = 'edital_analises';

    protected $fillable = [
        'edital_id',
        'status',
        'identified_type',
        'confidence',
        'result_snapshot',
        'extracted_fields',
        'error_message',
        'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'confidence' => 'decimal:4',
            'result_snapshot' => 'array',
            'extracted_fields' => 'array',
            'reviewed_at' => 'datetime',
        ];
    }

    public function edital(): BelongsTo
    {
        return $this->belongsTo(Edital::class);
    }
}
