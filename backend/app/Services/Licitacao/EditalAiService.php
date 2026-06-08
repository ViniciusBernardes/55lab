<?php

namespace App\Services\Licitacao;

use App\Jobs\ProcessEditalAiAnalysisJob;
use App\Models\Licitacao\Edital;
use App\Models\Licitacao\EditalAiConfig;
use App\Models\Licitacao\EditalAnalise;
use App\Services\Licitacao\EditalAi\EditalAiProvider;
use App\Services\Licitacao\EditalAi\MockEditalAiProvider;
use App\Services\Licitacao\EditalAi\OpenAiEditalAiProvider;
use App\Support\EditalAnalysisPrompt;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

class EditalAiService
{
    public function __construct(private readonly IaCredencialService $credencialService) {}

    public function isEnabled(): bool
    {
        return (bool) config('edital_ai.enabled', true);
    }

    public function defaultProvider(): string
    {
        return $this->credencialService->isOpenAiConfigured()
            ? 'openai'
            : config('edital_ai.default_provider', 'mock');
    }

    public function ensureConfig(Edital $edital): EditalAiConfig
    {
        return $edital->aiConfig()->firstOrCreate(
            ['edital_id' => $edital->id],
            [
                'enabled' => true,
                'provider' => $this->defaultProvider(),
                'model' => $this->credencialService->getOpenAi()->model,
                'system_prompt' => EditalAnalysisPrompt::SYSTEM,
                'extraction_schema' => null,
                'require_review' => false,
                'auto_analyze_on_upload' => true,
            ],
        );
    }

    public function queueAnalysis(Edital $edital): EditalAnalise
    {
        $config = $this->ensureConfig($edital);
        $config->update([
            'provider' => $this->defaultProvider(),
            'system_prompt' => EditalAnalysisPrompt::SYSTEM,
        ]);

        if (! $config->enabled) {
            throw new \InvalidArgumentException('Análise por IA desabilitada para este edital.');
        }

        if ($config->provider === 'openai' && ! $this->credencialService->isOpenAiConfigured()) {
            throw new \InvalidArgumentException('Configure as credenciais OpenAI antes de analisar editais.');
        }

        $analysis = EditalAnalise::create([
            'edital_id' => $edital->id,
            'status' => 'queued',
        ]);

        ProcessEditalAiAnalysisJob::dispatch($analysis->id);

        return $analysis;
    }

    public function runAnalysis(EditalAnalise $analysis): EditalAnalise
    {
        $analysis->load(['edital.aiConfig']);
        $edital = $analysis->edital;
        $config = $edital->aiConfig ?? $this->ensureConfig($edital);

        $analysis->update(['status' => 'processing', 'error_message' => null]);

        $provider = $this->resolveProvider($config->provider);
        $raw = $provider->analyzeEdital($edital, $config);
        $normalized = $provider->normalizeResult($raw);

        $docType = $normalized['documentType'] ?? null;
        $confidence = $normalized['confidence'] ?? null;
        $fields = is_array($normalized['fields'] ?? null) ? $normalized['fields'] : [];
        $fullRaw = is_array($normalized['raw'] ?? null) ? $normalized['raw'] : [];

        $extracted = $this->buildExtractedFields($fields, $fullRaw);

        $status = $config->require_review ? 'awaiting_review' : 'completed';

        $analysis->update([
            'identified_type' => $docType,
            'confidence' => $confidence !== null ? (float) $confidence : null,
            'result_snapshot' => $normalized,
            'extracted_fields' => $extracted,
            'status' => $status,
        ]);

        $this->applyAnalysisToEdital($edital, $fullRaw);

        return $analysis->fresh();
    }

    public function applyReview(EditalAnalise $analysis, bool $approved): EditalAnalise
    {
        if ($analysis->status !== 'awaiting_review') {
            throw new \InvalidArgumentException('Esta análise não está aguardando revisão.');
        }

        $analysis->update([
            'status' => $approved ? 'completed' : 'rejected',
            'reviewed_at' => now(),
        ]);

        return $analysis->fresh();
    }

    private function resolveProvider(string $provider): EditalAiProvider
    {
        return match ($provider) {
            'openai' => app(OpenAiEditalAiProvider::class),
            default => app(MockEditalAiProvider::class),
        };
    }

    /** @param  array<string, mixed>  $fields */
    /** @param  array<string, mixed>  $fullRaw */
    private function buildExtractedFields(array $fields, array $fullRaw): array
    {
        $labels = [
            'resumo' => 'Resumo executivo',
            'objeto' => 'Objeto',
            'data_licitacao' => 'Data da licitação',
            'valor_estimado' => 'Valor estimado',
            'tipo_licitacao' => 'Tipo de licitação',
            'orgao_responsavel' => 'Órgão responsável',
            'criterio_julgamento' => 'Critério de julgamento',
            'prazo_execucao' => 'Prazo de execução',
            'link_portal_leilao' => 'Portal do certame',
            'nome_portal_leilao' => 'Nome do portal',
            'forma_pagamento' => 'Forma de pagamento',
            'vale_a_pena' => 'Vale a pena participar',
        ];

        $extracted = [];

        foreach ($labels as $key => $label) {
            $value = Arr::get($fullRaw, $key, Arr::get($fields, $key));
            if ($value === null || $value === '') {
                continue;
            }

            $valStr = is_scalar($value) ? (string) $value : json_encode($value, JSON_UNESCAPED_UNICODE);

            $extracted[] = [
                'key' => $key,
                'label' => $label,
                'value' => $valStr,
                'confidence' => null,
            ];
        }

        return $extracted;
    }

    /** @param  array<string, mixed>  $analysis */
    private function applyAnalysisToEdital(Edital $edital, array $analysis): void
    {
        $updates = [];

        $objeto = Arr::get($analysis, 'objeto');
        if (filled($objeto)) {
            $updates['objeto'] = (string) $objeto;
            $updates['titulo'] = Str::limit((string) $objeto, 255, '');
        }

        if (filled($resumo = Arr::get($analysis, 'resumo'))) {
            $updates['observacoes'] = (string) $resumo;
        }

        if (filled($orgao = Arr::get($analysis, 'orgao_responsavel'))) {
            $updates['orgao'] = (string) $orgao;
        }

        if (filled($modalidade = Arr::get($analysis, 'tipo_licitacao'))) {
            $updates['modalidade'] = (string) $modalidade;
        }

        if (filled($data = Arr::get($analysis, 'data_licitacao'))) {
            $updates['data_abertura'] = (string) $data;
        }

        if (filled($valor = Arr::get($analysis, 'valor_estimado'))) {
            $parsed = $this->parseMoney((string) $valor);
            if ($parsed !== null) {
                $updates['valor_estimado'] = $parsed;
            }
        }

        if ($updates !== []) {
            $updates['status'] = 'publicado';
            $edital->update($updates);
        }
    }

    private function parseMoney(string $value): ?float
    {
        $clean = preg_replace('/[^\d,.-]/', '', $value) ?? '';
        if ($clean === '') {
            return null;
        }

        if (str_contains($clean, ',') && str_contains($clean, '.')) {
            $clean = str_replace('.', '', $clean);
            $clean = str_replace(',', '.', $clean);
        } elseif (str_contains($clean, ',')) {
            $clean = str_replace(',', '.', $clean);
        }

        return is_numeric($clean) ? (float) $clean : null;
    }
}
