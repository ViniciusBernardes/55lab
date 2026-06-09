<?php

namespace App\Models\Helpdesk;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TicketWebhookLog extends Model
{
    protected $fillable = [
        'ticket_id',
        'payload',
        'response_status',
        'response_body',
        'success',
        'error_message',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'success' => 'boolean',
        ];
    }

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }
}
