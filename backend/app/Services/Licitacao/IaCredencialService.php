<?php

namespace App\Services\Licitacao;

use App\Models\Licitacao\IaCredencial;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class IaCredencialService
{
    public function getOpenAi(): IaCredencial
    {
        return IaCredencial::query()->firstOrCreate(
            ['provider' => 'openai'],
            [
                'base_url' => config('edital_ai.openai.base_url', 'https://api.openai.com/v1'),
                'model' => config('edital_ai.default_model', 'gpt-4o-mini'),
                'is_active' => true,
            ],
        );
    }

    public function isOpenAiConfigured(): bool
    {
        $credencial = $this->getOpenAi();

        if (! $credencial->is_active) {
            return false;
        }

        if ($credencial->apiKeyDecryptFailed()) {
            return filled(config('edital_ai.openai.api_key'));
        }

        return filled($this->resolveApiKey($credencial));
    }

    public function resolveApiKey(?IaCredencial $credencial = null): ?string
    {
        $credencial ??= $this->getOpenAi();

        if ($credencial->apiKeyDecryptFailed()) {
            return config('edital_ai.openai.api_key') ?: null;
        }

        return $credencial->getApiKey() ?: config('edital_ai.openai.api_key');
    }

    public function assertOpenAiReady(?IaCredencial $credencial = null): void
    {
        $credencial ??= $this->getOpenAi();

        if (! $credencial->is_active) {
            throw new RuntimeException('Credencial OpenAI está inativa. Ative em /editais/credenciais.');
        }

        if (filled($this->resolveApiKey($credencial))) {
            return;
        }

        if ($credencial->apiKeyDecryptFailed()) {
            throw new RuntimeException(
                'A API Key salva não pode ser lida (APP_KEY do servidor mudou). '
                .'Salve a chave novamente em /editais/credenciais ou defina OPENAI_API_KEY no backend/.env.',
            );
        }

        throw new RuntimeException(
            'Credenciais OpenAI não configuradas. Cadastre a API Key em /editais/credenciais.',
        );
    }

    /** @return array<string, mixed> */
    public function toPublicArray(IaCredencial $credencial): array
    {
        $decryptFailed = $credencial->apiKeyDecryptFailed();
        $envKey = config('edital_ai.openai.api_key');

        return [
            'provider' => $credencial->provider,
            'base_url' => $credencial->base_url,
            'model' => $credencial->model,
            'is_active' => $credencial->is_active,
            'has_api_key' => filled($this->resolveApiKey($credencial)),
            'api_key_decrypt_failed' => $decryptFailed && ! filled($envKey),
            'api_key_source' => $decryptFailed && filled($envKey)
                ? 'env'
                : ($credencial->hasEncryptedApiKey() ? 'database' : (filled($envKey) ? 'env' : null)),
            'api_key_masked' => $decryptFailed && filled($envKey)
                ? 'env (OPENAI_API_KEY)'
                : ($credencial->maskedApiKey() ?: (
                    filled($envKey) ? 'env (OPENAI_API_KEY)' : null
                )),
            'updated_at' => $credencial->updated_at,
        ];
    }

    public function updateOpenAi(array $data): IaCredencial
    {
        $credencial = $this->getOpenAi();

        if (array_key_exists('api_key', $data)) {
            $apiKey = trim((string) ($data['api_key'] ?? ''));
            if ($apiKey !== '') {
                $credencial->api_key = $apiKey;
            }
        }

        if (isset($data['base_url'])) {
            $credencial->base_url = $data['base_url'];
        }

        if (isset($data['model'])) {
            $credencial->model = $data['model'];
        }

        if (array_key_exists('is_active', $data)) {
            $credencial->is_active = (bool) $data['is_active'];
        }

        $credencial->save();

        return $credencial->fresh();
    }

    public function testConnection(?IaCredencial $credencial = null): array
    {
        $credencial ??= $this->getOpenAi();
        $apiKey = $this->resolveApiKey($credencial);

        if (! $apiKey) {
            throw new RuntimeException('API Key não configurada.');
        }

        $response = Http::withToken($apiKey)
            ->baseUrl(rtrim($credencial->base_url, '/'))
            ->timeout(30)
            ->get('/models');

        if (! $response->successful()) {
            throw new RuntimeException('Falha ao conectar: '.$response->body());
        }

        return [
            'ok' => true,
            'message' => 'Conexão com OpenAI estabelecida com sucesso.',
        ];
    }
}
