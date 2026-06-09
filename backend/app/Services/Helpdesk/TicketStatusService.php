<?php

namespace App\Services\Helpdesk;

use App\Jobs\SendTicketWebhookJob;
use App\Models\Helpdesk\Ticket;
use App\Models\Helpdesk\TicketStatusHistory;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class TicketStatusService
{
    public function recordInitialStatus(Ticket $ticket, ?User $user = null): void
    {
        TicketStatusHistory::create([
            'ticket_id' => $ticket->id,
            'old_status' => null,
            'new_status' => $ticket->status,
            'changed_by' => $user?->id,
        ]);
    }

    public function changeStatus(
        Ticket $ticket,
        string $newStatus,
        ?User $user = null,
        ?string $message = null,
    ): Ticket {
        if ($ticket->status === $newStatus) {
            return $ticket;
        }

        return DB::transaction(function () use ($ticket, $newStatus, $user, $message) {
            $oldStatus = $ticket->status;

            $ticket->update([
                'status' => $newStatus,
                'closed_at' => $this->resolveClosedAt($ticket, $newStatus),
            ]);

            TicketStatusHistory::create([
                'ticket_id' => $ticket->id,
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
                'changed_by' => $user?->id,
            ]);

            $notificationMessage = $message ?? $this->defaultStatusMessage($newStatus);

            SendTicketWebhookJob::dispatch($ticket->id, $notificationMessage);

            return $ticket->fresh(['assignee']);
        });
    }

    private function resolveClosedAt(Ticket $ticket, string $newStatus): ?\Illuminate\Support\Carbon
    {
        if (in_array($newStatus, ['closed', 'cancelled'], true)) {
            return now();
        }

        if (in_array($newStatus, ['received', 'triage', 'in_progress', 'waiting_external', 'resolved'], true)) {
            return null;
        }

        return $ticket->closed_at;
    }

    private function defaultStatusMessage(string $status): string
    {
        return config("helpdesk.status_messages.{$status}")
            ?? 'Status do chamado atualizado.';
    }
}
