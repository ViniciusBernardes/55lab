<?php

namespace App\Models\Helpdesk;

use App\Models\User;
use Database\Factories\TicketFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ticket extends Model
{
    /** @use HasFactory<TicketFactory> */
    use HasFactory;
    protected $fillable = [
        'external_id',
        'title',
        'description',
        'type',
        'priority',
        'status',
        'requester_name',
        'requester_email',
        'external_system',
        'payload_original',
        'attachment_path',
        'attachment_filename',
        'attachment_mime',
        'attachment_size',
        'assigned_to',
        'closed_at',
    ];

    protected function casts(): array
    {
        return [
            'payload_original' => 'array',
            'attachment_size' => 'integer',
            'closed_at' => 'datetime',
        ];
    }

    public function hasAttachment(): bool
    {
        return filled($this->attachment_path);
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function interactions(): HasMany
    {
        return $this->hasMany(TicketInteraction::class)->latest();
    }

    public function statusHistories(): HasMany
    {
        return $this->hasMany(TicketStatusHistory::class)->latest();
    }

    public function webhookLogs(): HasMany
    {
        return $this->hasMany(TicketWebhookLog::class)->latest();
    }
}
