<?php

namespace App\Http\Controllers\Api\Licitacao;

use App\Http\Controllers\Controller;
use App\Http\Requests\Licitacao\UpdateEditalAiConfigRequest;
use App\Models\Licitacao\Edital;
use App\Services\Licitacao\EditalAiService;
use Illuminate\Http\JsonResponse;

class EditalAiConfigController extends Controller
{
    public function __construct(private readonly EditalAiService $aiService) {}

    public function show(Edital $edital): JsonResponse
    {
        return response()->json($this->aiService->ensureConfig($edital));
    }

    public function update(UpdateEditalAiConfigRequest $request, Edital $edital): JsonResponse
    {
        $config = $this->aiService->ensureConfig($edital);
        $config->update($request->validated());

        return response()->json($config->fresh());
    }
}
