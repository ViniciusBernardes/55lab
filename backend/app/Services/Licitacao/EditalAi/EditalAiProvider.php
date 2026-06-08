<?php

namespace App\Services\Licitacao\EditalAi;

use App\Models\Licitacao\Edital;
use App\Models\Licitacao\EditalAiConfig;

interface EditalAiProvider
{
    /**
     * @return array{
     *     documentType: string|null,
     *     confidence: float|null,
     *     fields: array<string, mixed>,
     *     fieldConfidences?: array<string, float>,
     *     raw?: array<string, mixed>
     * }
     */
    public function analyzeEdital(Edital $edital, EditalAiConfig $config): array;

    /** @return array<string, mixed> */
    public function normalizeResult(array $result): array;
}
