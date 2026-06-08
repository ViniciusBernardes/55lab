<?php

namespace App\Http\Controllers\Api\Licitacao;

use App\Http\Controllers\Controller;
use App\Services\Licitacao\IaCredencialService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IaCredencialController extends Controller
{
    public function __construct(private readonly IaCredencialService $service) {}

    public function showOpenAi(): JsonResponse
    {
        return response()->json($this->service->toPublicArray($this->service->getOpenAi()));
    }

    public function updateOpenAi(Request $request): JsonResponse
    {
        $data = $request->validate([
            'api_key' => ['nullable', 'string', 'max:500'],
            'base_url' => ['nullable', 'url', 'max:255'],
            'model' => ['nullable', 'string', 'max:100'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $credencial = $this->service->updateOpenAi($data);

        return response()->json($this->service->toPublicArray($credencial));
    }

    public function testOpenAi(): JsonResponse
    {
        return response()->json($this->service->testConnection());
    }
}
