<?php

namespace App\Services\Helpdesk;

use App\Models\Helpdesk\HelpdeskExternalSystem;
use App\Models\Helpdesk\Ticket;
use Illuminate\Support\Facades\Http;

class HelpdeskExternalSystemService
{
    public function resolveWebhookUrl(Ticket $ticket): ?string
    {
        $system = HelpdeskExternalSystem::query()
            ->where('code', $ticket->external_system)
            ->where('is_active', true)
            ->first();

        if (filled($system?->webhook_url)) {
            return $system->webhook_url;
        }

        $fallback = config('helpdesk.webhook_url');

        return filled($fallback) ? (string) $fallback : null;
    }

    /** @param  array<string, mixed>  $data */
    public function create(array $data): HelpdeskExternalSystem
    {
        return HelpdeskExternalSystem::create($data);
    }

    /** @param  array<string, mixed>  $data */
    public function update(HelpdeskExternalSystem $system, array $data): HelpdeskExternalSystem
    {
        $system->update($data);

        return $system->fresh();
    }

    public function delete(HelpdeskExternalSystem $system): void
    {
        $system->delete();
    }

    /** @return array{success: bool, message: string, response_status: int|null} */
    public function testWebhook(HelpdeskExternalSystem $system): array
    {
        try {
            $response = Http::timeout(config('helpdesk.webhook_timeout', 15))
                ->acceptJson()
                ->asJson()
                ->post($system->webhook_url, [
                    'external_id' => 'teste-helpdesk',
                    'ticket_id' => 0,
                    'status' => 'received',
                    'message' => 'Teste de webhook do 55LAB Helpdesk.',
                    'updated_at' => now()->toIso8601String(),
                ]);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'message' => 'Webhook respondeu com sucesso.',
                    'response_status' => $response->status(),
                ];
            }

            return [
                'success' => false,
                'message' => "Webhook retornou HTTP {$response->status()}.",
                'response_status' => $response->status(),
            ];
        } catch (\Throwable $exception) {
            return [
                'success' => false,
                'message' => $exception->getMessage(),
                'response_status' => null,
            ];
        }
    }
}
