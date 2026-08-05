<?php

namespace App\Http\Controllers\Api\Licitacao;

use App\Http\Controllers\Controller;
use App\Models\Licitacao\EditalAlertaImport;
use App\Services\Licitacao\Alerta\AlertaEditalImportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class EditalAlertaImportController extends Controller
{
    public function __construct(
        private readonly AlertaEditalImportService $importService,
    ) {}

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'arquivo' => [
                'required',
                'file',
                'max:51200',
                'mimetypes:application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/octet-stream',
            ],
            'segmentos' => ['sometimes', 'array'],
            'segmentos.*' => ['string', 'in:software,protocolo,gestao_educacional,cesta_de_preco'],
        ]);

        $file = $request->file('arquivo');
        $ext = strtolower((string) $file->getClientOriginalExtension());
        if (! in_array($ext, ['pdf', 'xlsx', 'xls', 'xlsm'], true)) {
            return response()->json([
                'message' => 'Envie um PDF de alerta (PCP/BLL) ou uma planilha de oportunidades (.xlsx).',
            ], 422);
        }

        try {
            $import = $this->importService->queueImport(
                $file,
                $validated['segmentos'] ?? null,
            );
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'import' => $import,
            'message' => 'Alerta recebido. A extração e análise dos editais foram enfileiradas.',
        ], 201);
    }

    public function show(EditalAlertaImport $alertaImport): JsonResponse
    {
        return response()->json(
            $alertaImport->load(['editais.ultimaAnalise']),
        );
    }

    public function segmentos(): JsonResponse
    {
        $items = [];
        foreach (config('edital_alerta.segmentos', []) as $key => $config) {
            $items[] = [
                'key' => $key,
                'label' => $config['label'] ?? $key,
            ];
        }

        return response()->json([
            'segmentos' => $items,
            'defaults' => config('edital_alerta.default_segmentos', []),
        ]);
    }
}
