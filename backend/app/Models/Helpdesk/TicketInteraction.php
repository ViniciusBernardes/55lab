<?php

namespace App\Models\Helpdesk;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TicketInteraction extends Model
{
    protected $fillable = [
        'ticket_id',
        'user_id',
        'message',
        'internal_only',
    ];

    protected function casts(): array
    {
        return [
            'internal_only' => 'boolean',
        ];
    }

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
