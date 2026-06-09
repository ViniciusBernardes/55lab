<?php

namespace Tests\Feature\Helpdesk;

use App\Models\Helpdesk\HelpdeskExternalSystem;
use App\Models\Helpdesk\Ticket;
use App\Models\User;
use App\Services\Helpdesk\HelpdeskExternalSystemService;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class HelpdeskExternalSystemTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['helpdesk.webhook_url' => null]);
        $this->withoutMiddleware(ValidateCsrfToken::class);
    }

    public function test_can_create_external_system(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/helpdesk/external-systems', [
            'code' => 'portal-vendas',
            'name' => 'Portal de Vendas',
            'webhook_url' => 'https://vendas.example/webhook',
            'description' => 'Sistema comercial',
            'is_active' => true,
        ]);

        $response->assertCreated()
            ->assertJsonPath('code', 'portal-vendas');

        $this->assertDatabaseHas('helpdesk_external_systems', [
            'code' => 'portal-vendas',
            'webhook_url' => 'https://vendas.example/webhook',
        ]);
    }

    public function test_webhook_resolver_uses_registered_system_url(): void
    {
        HelpdeskExternalSystem::create([
            'code' => 'erp-interno',
            'name' => 'ERP Interno',
            'webhook_url' => 'https://erp.example/hooks/helpdesk',
            'is_active' => true,
        ]);

        $ticket = Ticket::factory()->create([
            'external_system' => 'erp-interno',
        ]);

        $url = app(HelpdeskExternalSystemService::class)->resolveWebhookUrl($ticket);

        $this->assertSame('https://erp.example/hooks/helpdesk', $url);
    }

    public function test_can_test_external_system_webhook(): void
    {
        Http::fake([
            'https://erp.example/hooks/helpdesk' => Http::response(['ok' => true], 200),
        ]);

        $user = User::factory()->create();
        $system = HelpdeskExternalSystem::create([
            'code' => 'erp-interno',
            'name' => 'ERP Interno',
            'webhook_url' => 'https://erp.example/hooks/helpdesk',
            'is_active' => true,
        ]);

        $response = $this->actingAs($user)->postJson(
            "/api/helpdesk/external-systems/{$system->id}/test",
        );

        $response->assertOk()
            ->assertJsonPath('success', true);
    }
}
