<?php

namespace App\Jobs;

use App\Models\Helpdesk\Ticket;
use App\Services\Helpdesk\ExternalHelpdeskWebhookService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendTicketWebhookJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries;

    /** @var list<int> */
    public array $backoff = [10, 30, 60];

    public function __construct(
        public int $ticketId,
        public ?string $message = null,
    ) {
        $this->tries = max(1, (int) config('helpdesk.webhook_retries', 3));
    }

    public function handle(ExternalHelpdeskWebhookService $webhookService): void
    {
        $ticket = Ticket::query()->find($this->ticketId);

        if (! $ticket) {
            Log::warning('Ticket não encontrado para webhook.', [
                'ticket_id' => $this->ticketId,
            ]);

            return;
        }

        $success = $webhookService->notify($ticket, $this->message);

        if ($success) {
            return;
        }

        if ($this->attempts() < $this->tries) {
            $delay = $this->backoff[$this->attempts() - 1] ?? 60;
            $this->release($delay);

            return;
        }

        Log::error('Helpdesk webhook falhou após todas as tentativas.', [
            'ticket_id' => $this->ticketId,
            'attempts' => $this->attempts(),
        ]);
    }
}
