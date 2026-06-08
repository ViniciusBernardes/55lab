<?php

namespace App\Services\Licitacao\EditalAi;

use App\Models\Licitacao\Edital;
use App\Models\Licitacao\EditalAiConfig;
use App\Support\EditalAnalysisPrompt;
use App\Services\Licitacao\EditalDocumentExtractor;
use App\Services\Licitacao\IaCredencialService;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class OpenAiEditalAiProvider implements EditalAiProvider
{
    public function __construct(
        private readonly IaCredencialService $credencialService,
        private readonly EditalDocumentExtractor $documentExtractor,
    ) {}

    public function analyzeEdital(Edital $edital, EditalAiConfig $config): array
    {
        $credencial = $this->credencialService->getOpenAi();
        $apiKey = $credencial->getApiKey() ?: config('edital_ai.openai.api_key');

        if (! $apiKey) {
            throw new RuntimeException('Credenciais OpenAI não configuradas. Cadastre a API Key em /editais/credenciais.');
        }

        $systemPrompt = $config->system_prompt ?: EditalAnalysisPrompt::SYSTEM;
        $extractedText = $this->documentExtractor->extract($edital);
        $userContent = EditalAnalysisPrompt::buildUserContent($extractedText);

        $response = Http::withToken($apiKey)
            ->baseUrl(rtrim($credencial->base_url, '/'))
            ->timeout(300)
            ->post('/chat/completions', [
                'model' => $config->model ?: $credencial->model,
                'temperature' => 0.1,
                'response_format' => ['type' => 'json_object'],
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => $userContent],
                ],
            ]);

        if (! $response->successful()) {
            throw new RuntimeException('Falha na API OpenAI: '.$response->body());
        }

        $content = data_get($response->json(), 'choices.0.message.content');
        $decoded = is_string($content) ? json_decode($content, true) : null;

        if (! is_array($decoded)) {
            throw new RuntimeException('Resposta inválida da IA.');
        }

        return [
            'documentType' => 'EDITAL_LICITACAO',
            'confidence' => $this->estimateConfidence($decoded),
            'fields' => $this->flattenTopLevelFields($decoded),
            'fieldConfidences' => [],
            'raw' => $decoded,
        ];
    }

    public function normalizeResult(array $result): array
    {
        return [
            'documentType' => $result['documentType'] ?? 'EDITAL_LICITACAO',
            'confidence' => isset($result['confidence']) ? (float) $result['confidence'] : null,
            'fields' => is_array($result['fields'] ?? null) ? $result['fields'] : [],
            'fieldConfidences' => is_array($result['fieldConfidences'] ?? null) ? $result['fieldConfidences'] : [],
            'raw' => is_array($result['raw'] ?? null) ? $result['raw'] : [],
        ];
    }

    /** @param  array<string, mixed>  $decoded */
    private function estimateConfidence(array $decoded): float
    {
        $filled = 0;
        $total = 0;

        foreach (['resumo', 'objeto', 'orgao_responsavel', 'tipo_licitacao', 'valor_estimado'] as $key) {
            $total++;
            if (filled($decoded[$key] ?? null)) {
                $filled++;
            }
        }

        return $total > 0 ? round($filled / $total, 2) : 0.75;
    }

    /** @param  array<string, mixed>  $decoded */
    private function flattenTopLevelFields(array $decoded): array
    {
        $fields = [];

        foreach ($decoded as $key => $value) {
            if ($key === 'analise_completa') {
                continue;
            }

            if (is_scalar($value) || $value === null) {
                $fields[$key] = $value;
            } elseif (is_array($value)) {
                $fields[$key] = json_encode($value, JSON_UNESCAPED_UNICODE);
            }
        }

        return $fields;
    }
}
