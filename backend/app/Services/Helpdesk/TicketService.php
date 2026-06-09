<?php

namespace App\Services\Helpdesk;

use App\Jobs\SendTicketWebhookJob;
use App\Models\Helpdesk\Ticket;
use App\Models\Helpdesk\TicketInteraction;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TicketService
{
    public function __construct(
        private readonly TicketStatusService $statusService,
        private readonly TicketAttachmentService $attachmentService,
    ) {}

    public function paginate(Request $request): LengthAwarePaginator
    {
        $query = Ticket::query()->with(['assignee']);

        if ($status = $request->string('status')->toString()) {
            $query->where('status', $status);
        }

        if ($type = $request->string('type')->toString()) {
            $query->where('type', $type);
        }

        if ($priority = $request->string('priority')->toString()) {
            $query->where('priority', $priority);
        }

        if ($search = $request->string('q')->toString()) {
            $query->where(function ($builder) use ($search) {
                $builder->where('title', 'like', "%{$search}%")
                    ->orWhere('external_id', 'like', "%{$search}%")
                    ->orWhere('requester_name', 'like', "%{$search}%")
                    ->orWhere('requester_email', 'like', "%{$search}%");
            });
        }

        return $query->latest()->paginate($request->integer('per_page', 15));
    }

    /** @param  array<string, mixed>  $payload */
    /** @param  array<string, mixed>|null  $attachment */
    public function createFromExternal(
        array $payload,
        array $originalPayload,
        ?array $attachment = null,
    ): Ticket {
        $ticket = DB::transaction(function () use ($payload, $originalPayload, $attachment) {
            $created = Ticket::create([
                'external_id' => $payload['external_id'],
                'title' => $payload['title'],
                'description' => $payload['description'],
                'type' => $payload['type'],
                'priority' => $payload['priority'],
                'status' => 'received',
                'requester_name' => $payload['requester_name'],
                'requester_email' => $payload['requester_email'],
                'external_system' => $payload['external_system'],
                'payload_original' => $this->attachmentService->sanitizePayloadForStorage($originalPayload),
            ]);

            if ($attachment !== null) {
                $this->attachmentService->storeFromPayload($created, $attachment);
                $created = $created->fresh();
            }

            $this->statusService->recordInitialStatus($created);

            return $created;
        });

        SendTicketWebhookJob::dispatch(
            $ticket->id,
            config('helpdesk.status_messages.received'),
        );

        return $ticket->fresh(['assignee']);
    }

    public function findDuplicate(string $externalSystem, string $externalId): ?Ticket
    {
        return Ticket::query()
            ->where('external_system', $externalSystem)
            ->where('external_id', $externalId)
            ->first();
    }

    public function assign(Ticket $ticket, ?int $userId): Ticket
    {
        $ticket->update(['assigned_to' => $userId]);

        return $ticket->fresh(['assignee']);
    }

    public function addInteraction(
        Ticket $ticket,
        string $message,
        bool $internalOnly,
        ?User $user = null,
    ): TicketInteraction {
        $interaction = TicketInteraction::create([
            'ticket_id' => $ticket->id,
            'user_id' => $user?->id,
            'message' => $message,
            'internal_only' => $internalOnly,
        ]);

        if (! $internalOnly) {
            SendTicketWebhookJob::dispatch($ticket->id, $message);
        }

        return $interaction->load('user');
    }
}
