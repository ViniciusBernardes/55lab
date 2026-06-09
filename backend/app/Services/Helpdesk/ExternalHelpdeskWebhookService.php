<?php

namespace App\Services\Helpdesk;

use App\Models\Helpdesk\Ticket;
use App\Models\Helpdesk\TicketWebhookLog;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ExternalHelpdeskWebhookService
{
    public function __construct(
        private readonly HelpdeskExternalSystemService $externalSystemService,
    ) {}

    public function notify(Ticket $ticket, ?string $message = null): bool
    {
        $url = $this->externalSystemService->resolveWebhookUrl($ticket);

        if (! filled($url)) {
            $this->logFailure(
                $ticket,
                [],
                null,
                "URL do webhook não configurada para o sistema {$ticket->external_system}.",
            );

            return false;
        }

        $payload = $this->buildPayload($ticket, $message);

        try {
            $response = Http::timeout(config('helpdesk.webhook_timeout', 15))
                ->acceptJson()
                ->asJson()
                ->post($url, $payload);

            if ($response->successful()) {
                $this->logSuccess($ticket, $payload, $response->status(), $response->body());

                return true;
            }

            $error = "Webhook retornou HTTP {$response->status()}.";
            $this->logFailure($ticket, $payload, $response->status(), $error, $response->body());

            return false;
        } catch (\Throwable $exception) {
            $this->logFailure($ticket, $payload, null, $exception->getMessage());

            return false;
        }
    }

    /** @return array<string, mixed> */
    public function buildPayload(Ticket $ticket, ?string $message = null): array
    {
        return [
            'external_id' => $ticket->external_id,
            'ticket_id' => $ticket->id,
            'status' => $ticket->status,
            'message' => $message ?? config("helpdesk.status_messages.{$ticket->status}", 'Status atualizado.'),
            'updated_at' => $ticket->updated_at?->toIso8601String(),
        ];
    }

    /** @param  array<string, mixed>  $payload */
    private function logSuccess(
        Ticket $ticket,
        array $payload,
        int $responseStatus,
        ?string $responseBody,
    ): void {
        TicketWebhookLog::create([
            'ticket_id' => $ticket->id,
            'payload' => $payload,
            'response_status' => $responseStatus,
            'response_body' => $responseBody,
            'success' => true,
        ]);

        Log::info('Helpdesk webhook enviado com sucesso.', [
            'ticket_id' => $ticket->id,
            'external_id' => $ticket->external_id,
            'external_system' => $ticket->external_system,
            'status' => $ticket->status,
        ]);
    }

    /** @param  array<string, mixed>  $payload */
    private function logFailure(
        Ticket $ticket,
        array $payload,
        ?int $responseStatus,
        string $errorMessage,
        ?string $responseBody = null,
    ): void {
        TicketWebhookLog::create([
            'ticket_id' => $ticket->id,
            'payload' => $payload,
            'response_status' => $responseStatus,
            'response_body' => $responseBody,
            'success' => false,
            'error_message' => $errorMessage,
        ]);

        Log::warning('Falha ao enviar webhook do helpdesk.', [
            'ticket_id' => $ticket->id,
            'external_id' => $ticket->external_id,
            'external_system' => $ticket->external_system,
            'error' => $errorMessage,
        ]);
    }
}
