<?php

namespace Tests\Feature\Helpdesk;

use App\Models\Helpdesk\HelpdeskExternalSystem;
use App\Models\Helpdesk\Ticket;
use App\Models\Helpdesk\TicketInteraction;
use App\Models\Helpdesk\TicketStatusHistory;
use App\Models\Helpdesk\TicketWebhookLog;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class TicketTest extends TestCase
{
    use RefreshDatabase;

    private const API_KEY = 'test-helpdesk-key';

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'helpdesk.external_api_key' => self::API_KEY,
            'helpdesk.webhook_url' => null,
        ]);

        HelpdeskExternalSystem::create([
            'code' => 'sistema-cliente',
            'name' => 'Sistema Cliente',
            'webhook_url' => 'https://external.example/webhook',
            'is_active' => true,
        ]);

        $this->withoutMiddleware(ValidateCsrfToken::class);
    }

    /** @return array<string, mixed> */
    private function externalPayload(string $externalId = '12345'): array
    {
        return [
            'external_id' => $externalId,
            'title' => 'Erro ao salvar pedido',
            'description' => 'Usuário relata erro ao salvar pedido no sistema',
            'type' => 'bug',
            'priority' => 'alta',
            'requester' => [
                'name' => 'João Silva',
                'email' => 'joao@email.com',
            ],
            'external_system' => 'sistema-cliente',
        ];
    }

    public function test_external_ticket_is_created_with_valid_api_key(): void
    {
        Http::fake([
            'https://external.example/webhook' => Http::response(['ok' => true], 200),
        ]);

        $response = $this->postJson('/api/helpdesk/tickets/external', $this->externalPayload(), [
            'X-API-KEY' => self::API_KEY,
        ]);

        $response->assertCreated()
            ->assertJsonPath('status', 'received')
            ->assertJsonPath('external_id', '12345')
            ->assertJsonPath('requester_email', 'joao@email.com');

        $this->assertDatabaseHas('tickets', [
            'external_id' => '12345',
            'status' => 'received',
            'type' => 'bug',
            'priority' => 'alta',
        ]);

        $ticket = Ticket::first();
        $this->assertNotNull($ticket?->payload_original);
        $this->assertDatabaseHas('ticket_status_histories', [
            'ticket_id' => $ticket->id,
            'old_status' => null,
            'new_status' => 'received',
        ]);

        Http::assertSent(function ($request) use ($ticket) {
            return $request->url() === 'https://external.example/webhook'
                && $request['external_id'] === '12345'
                && $request['ticket_id'] === $ticket->id
                && $request['status'] === 'received';
        });
    }

    public function test_external_ticket_rejects_invalid_api_key(): void
    {
        $response = $this->postJson('/api/helpdesk/tickets/external', $this->externalPayload(), [
            'X-API-KEY' => 'invalid-key',
        ]);

        $response->assertUnauthorized()
            ->assertJsonPath('message', 'API key inválida.');

        $this->assertDatabaseCount('tickets', 0);
    }

    public function test_external_ticket_prevents_duplicate_external_id(): void
    {
        Http::fake([
            'https://external.example/webhook' => Http::response(['ok' => true], 200),
        ]);

        $this->postJson('/api/helpdesk/tickets/external', $this->externalPayload(), [
            'X-API-KEY' => self::API_KEY,
        ])->assertCreated();

        $response = $this->postJson('/api/helpdesk/tickets/external', $this->externalPayload(), [
            'X-API-KEY' => self::API_KEY,
        ]);

        $response->assertStatus(409)
            ->assertJsonPath('message', 'Ticket já registrado para este external_id.');

        $this->assertDatabaseCount('tickets', 1);
    }

    public function test_status_change_records_history_and_notifies_external_system(): void
    {
        Http::fake([
            'https://external.example/webhook' => Http::response(['ok' => true], 200),
        ]);

        $user = User::factory()->create();
        $ticket = Ticket::factory()->create([
            'external_id' => '999',
            'external_system' => 'sistema-cliente',
            'status' => 'received',
        ]);

        TicketStatusHistory::create([
            'ticket_id' => $ticket->id,
            'old_status' => null,
            'new_status' => 'received',
            'changed_by' => null,
        ]);

        Http::fake([
            'https://external.example/webhook' => Http::response(['ok' => true], 200),
        ]);

        $response = $this->actingAs($user)->patchJson(
            "/api/helpdesk/tickets/{$ticket->id}/status",
            [
                'status' => 'in_progress',
                'message' => 'Seu chamado está em atendimento',
            ],
        );

        $response->assertOk()
            ->assertJsonPath('status', 'in_progress');

        $this->assertDatabaseHas('ticket_status_histories', [
            'ticket_id' => $ticket->id,
            'old_status' => 'received',
            'new_status' => 'in_progress',
            'changed_by' => $user->id,
        ]);

        Http::assertSent(function ($request) use ($ticket) {
            return $request['ticket_id'] === $ticket->id
                && $request['status'] === 'in_progress'
                && $request['message'] === 'Seu chamado está em atendimento';
        });
    }

    public function test_webhook_failure_does_not_block_status_change(): void
    {
        Http::fake([
            'https://external.example/webhook' => Http::response('error', 500),
        ]);

        $user = User::factory()->create();
        $ticket = Ticket::factory()->create(['status' => 'received']);

        $response = $this->actingAs($user)->patchJson(
            "/api/helpdesk/tickets/{$ticket->id}/status",
            ['status' => 'triage'],
        );

        $response->assertOk()
            ->assertJsonPath('status', 'triage');

        $this->assertDatabaseHas('tickets', [
            'id' => $ticket->id,
            'status' => 'triage',
        ]);

        $this->assertDatabaseHas('ticket_webhook_logs', [
            'ticket_id' => $ticket->id,
            'success' => false,
        ]);
    }

    public function test_internal_interaction_is_not_sent_to_external_webhook(): void
    {
        Http::fake();

        $user = User::factory()->create();
        $ticket = Ticket::factory()->create(['status' => 'in_progress']);

        $response = $this->actingAs($user)->postJson(
            "/api/helpdesk/tickets/{$ticket->id}/interactions",
            [
                'message' => 'Comentário interno da equipe',
                'internal_only' => true,
            ],
        );

        $response->assertCreated();

        $this->assertDatabaseHas('ticket_interactions', [
            'ticket_id' => $ticket->id,
            'message' => 'Comentário interno da equipe',
            'internal_only' => true,
        ]);

        Http::assertNothingSent();
    }

    public function test_public_interaction_notifies_external_system(): void
    {
        Http::fake([
            'https://external.example/webhook' => Http::response(['ok' => true], 200),
        ]);

        $user = User::factory()->create();
        $ticket = Ticket::factory()->create([
            'status' => 'in_progress',
            'external_id' => '777',
        ]);

        $response = $this->actingAs($user)->postJson(
            "/api/helpdesk/tickets/{$ticket->id}/interactions",
            [
                'message' => 'Estamos analisando seu chamado.',
                'internal_only' => false,
            ],
        );

        $response->assertCreated();

        Http::assertSent(function ($request) use ($ticket) {
            return $request['ticket_id'] === $ticket->id
                && $request['message'] === 'Estamos analisando seu chamado.';
        });
    }

    public function test_external_ticket_stores_attachment(): void
    {
        Storage::fake('local');

        Http::fake([
            'https://external.example/webhook' => Http::response(['ok' => true], 200),
        ]);

        $content = base64_encode('%PDF-1.4 fake pdf content');

        $response = $this->postJson('/api/helpdesk/tickets/external', [
            ...$this->externalPayload('550e8400-e29b-41d4-a716-446655440000'),
            'external_system' => 'sistema-cliente',
            'attachment' => [
                'filename' => 'evidencia.pdf',
                'mime' => 'application/pdf',
                'size' => strlen(base64_decode($content)),
                'content' => $content,
            ],
        ], [
            'X-API-KEY' => self::API_KEY,
        ]);

        $response->assertCreated()
            ->assertJsonPath('attachment_filename', 'evidencia.pdf')
            ->assertJsonPath('attachment_mime', 'application/pdf');

        $ticket = Ticket::first();
        $this->assertNotNull($ticket?->attachment_path);
        Storage::disk('local')->assertExists($ticket->attachment_path);

        $payload = $ticket->payload_original;
        $this->assertArrayNotHasKey('content', $payload['attachment'] ?? []);
    }

    public function test_authenticated_user_can_download_ticket_attachment(): void
    {
        Storage::fake('local');

        $user = User::factory()->create();
        $ticket = Ticket::factory()->create([
            'attachment_path' => 'helpdesk/tickets/1/test.pdf',
            'attachment_filename' => 'evidencia.pdf',
            'attachment_mime' => 'application/pdf',
            'attachment_size' => 16,
        ]);

        Storage::disk('local')->put($ticket->attachment_path, 'conteudo-teste');

        $response = $this->actingAs($user)->get("/api/helpdesk/tickets/{$ticket->id}/attachment");

        $response->assertOk();
        $this->assertStringContainsString('evidencia.pdf', (string) $response->headers->get('content-disposition'));
    }

    public function test_ticket_history_endpoint_returns_status_changes(): void
    {
        $user = User::factory()->create();
        $ticket = Ticket::factory()->create(['status' => 'resolved']);

        TicketStatusHistory::create([
            'ticket_id' => $ticket->id,
            'old_status' => 'in_progress',
            'new_status' => 'resolved',
            'changed_by' => $user->id,
        ]);

        $response = $this->actingAs($user)->getJson("/api/helpdesk/tickets/{$ticket->id}/history");

        $response->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.new_status', 'resolved');
    }
}
