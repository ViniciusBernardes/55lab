<?php

namespace App\Services\Licitacao\EditalAi;

use App\Models\Licitacao\Edital;
use App\Models\Licitacao\EditalAiConfig;

class MockEditalAiProvider implements EditalAiProvider
{
    public function analyzeEdital(Edital $edital, EditalAiConfig $config): array
    {
        $fields = $this->buildFields($edital, $config);

        return [
            'documentType' => 'EDITAL_LICITACAO',
            'confidence' => 0.87,
            'fields' => $fields,
            'fieldConfidences' => $this->fieldConfidences($fields),
            'raw' => [
                'provider' => 'mock',
                'message' => 'Análise simulada para desenvolvimento.',
            ],
        ];
    }

    public function normalizeResult(array $result): array
    {
        return [
            'documentType' => $result['documentType'] ?? null,
            'confidence' => isset($result['confidence']) ? (float) $result['confidence'] : null,
            'fields' => is_array($result['fields'] ?? null) ? $result['fields'] : [],
            'fieldConfidences' => is_array($result['fieldConfidences'] ?? null) ? $result['fieldConfidences'] : [],
            'raw' => is_array($result['raw'] ?? null) ? $result['raw'] : [],
        ];
    }

    /** @return array<string, mixed> */
    private function buildFields(Edital $edital, EditalAiConfig $config): array
    {
        $schema = $config->extraction_schema ?? config('edital_ai.default_extraction_schema');
        $keys = collect($schema['fields'] ?? [])->pluck('key')->filter()->all();

        $defaults = [
            'numero_edital' => $edital->numero ?: '001/2026',
            'orgao' => $edital->orgao ?: 'Prefeitura Municipal — Secretaria de Administração',
            'modalidade' => $edital->modalidade ?: 'Pregão Eletrônico',
            'objeto' => $edital->objeto ?: $edital->titulo,
            'valor_estimado' => $edital->valor_estimado ? number_format((float) $edital->valor_estimado, 2, ',', '.') : '150.000,00',
            'data_abertura' => $edital->data_abertura?->format('d/m/Y') ?: '15/06/2026',
            'data_encerramento' => $edital->data_encerramento?->format('d/m/Y') ?: '30/06/2026',
            'prazo_entrega_propostas' => 'Até 30/06/2026 às 14h',
            'criterio_julgamento' => 'Menor preço por item',
            'contato' => 'licitacoes@orgao.gov.br · (11) 3000-0000',
        ];

        $fields = [];
        foreach ($keys as $key) {
            $fields[$key] = $defaults[$key] ?? '—';
        }

        return $fields;
    }

    /** @param  array<string, mixed>  $fields */
    private function fieldConfidences(array $fields): array
    {
        $confidences = [];
        foreach (array_keys($fields) as $key) {
            $confidences[$key] = match ($key) {
                'numero_edital', 'orgao', 'modalidade' => 0.92,
                'objeto' => 0.88,
                default => 0.8,
            };
        }

        return $confidences;
    }
}
