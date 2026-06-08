<?php

namespace App\Http\Controllers\Api\Licitacao;

use App\Http\Controllers\Controller;
use App\Models\Licitacao\Edital;
use App\Models\Licitacao\EditalAnalise;
use App\Services\Licitacao\EditalAiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EditalAnaliseController extends Controller
{
    public function __construct(private readonly EditalAiService $aiService) {}

    public function index(Edital $edital): JsonResponse
    {
        return response()->json($edital->analises()->paginate(20));
    }

    public function store(Edital $edital): JsonResponse
    {
        $analysis = $this->aiService->queueAnalysis($edital);

        return response()->json($analysis, 202);
    }

    public function show(EditalAnalise $analise): JsonResponse
    {
        return response()->json($analise->load('edital'));
    }

    public function review(Request $request, EditalAnalise $analise): JsonResponse
    {
        $request->validate([
            'approved' => ['required', 'boolean'],
        ]);

        $updated = $this->aiService->applyReview($analise, (bool) $request->boolean('approved'));

        return response()->json($updated);
    }
}
