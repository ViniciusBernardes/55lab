<?php

namespace App\Http\Controllers\Api\Licitacao;

use App\Http\Controllers\Controller;
use App\Http\Requests\Licitacao\StoreEditalRequest;
use App\Http\Requests\Licitacao\UpdateEditalRequest;
use App\Models\Licitacao\Edital;
use App\Services\Licitacao\EditalAiService;
use App\Services\Licitacao\IaCredencialService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class EditalController extends Controller
{
    public function __construct(
        private readonly EditalAiService $aiService,
        private readonly IaCredencialService $credencialService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = Edital::query()->with(['aiConfig', 'ultimaAnalise']);

        if ($status = $request->string('status')->toString()) {
            $query->where('status', $status);
        }

        if ($search = $request->string('q')->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('titulo', 'like', "%{$search}%")
                    ->orWhere('numero', 'like', "%{$search}%")
                    ->orWhere('orgao', 'like', "%{$search}%");
            });
        }

        if ($request->filled('data_de') || $request->filled('data_ate')) {
            $query->whereNotNull('data_abertura');
        }

        if ($dataDe = $request->date('data_de')?->toDateString()) {
            $query->where('data_abertura', '>=', $dataDe);
        }

        if ($dataAte = $request->date('data_ate')?->toDateString()) {
            $query->where('data_abertura', '<=', $dataAte);
        }

        $editais = $query->latest()->paginate($request->integer('per_page', 15));

        return response()->json($editais);
    }

    public function store(StoreEditalRequest $request): JsonResponse
    {
        $edital = Edital::create($request->validated());
        $this->aiService->ensureConfig($edital);

        return response()->json(
            $edital->load(['aiConfig', 'ultimaAnalise']),
            201,
        );
    }

    public function show(Edital $editai): JsonResponse
    {
        return response()->json(
            $editai->load(['aiConfig', 'analises', 'ultimaAnalise']),
        );
    }

    public function update(UpdateEditalRequest $request, Edital $editai): JsonResponse
    {
        $editai->update($request->validated());

        return response()->json(
            $editai->fresh()->load(['aiConfig', 'ultimaAnalise']),
        );
    }

    public function destroy(Edital $editai): JsonResponse
    {
        if ($editai->arquivo_path) {
            Storage::disk('local')->delete($editai->arquivo_path);
        }

        $editai->delete();

        return response()->json(['message' => 'Edital removido.']);
    }

    public function importar(Request $request): JsonResponse
    {
        $request->validate([
            'arquivo' => ['required', 'file', 'mimes:pdf,txt,doc,docx', 'max:51200'],
        ]);

        if (! $this->credencialService->isOpenAiConfigured()) {
            return response()->json([
                'message' => 'Configure as credenciais OpenAI antes de importar editais.',
            ], 422);
        }

        $file = $request->file('arquivo');
        $baseName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);

        $edital = Edital::create([
            'titulo' => Str::limit($baseName, 255, ''),
            'status' => 'rascunho',
        ]);

        $path = $file->store("editais/{$edital->id}");

        $edital->update([
            'arquivo_path' => $path,
            'arquivo_nome_original' => $file->getClientOriginalName(),
            'arquivo_mime' => $file->getMimeType(),
            'arquivo_tamanho' => $file->getSize(),
        ]);

        $this->aiService->ensureConfig($edital->fresh());
        $analysis = $this->aiService->queueAnalysis($edital);

        return response()->json([
            'edital' => $edital->fresh()->load(['aiConfig', 'ultimaAnalise']),
            'analise' => $analysis,
        ], 201);
    }

    public function downloadArquivo(Edital $edital): StreamedResponse
    {
        if (! $edital->arquivo_path || ! Storage::disk('local')->exists($edital->arquivo_path)) {
            abort(404, 'Arquivo não encontrado.');
        }

        $nome = $edital->arquivo_nome_original ?: 'edital.pdf';
        $mime = $edital->arquivo_mime ?: Storage::disk('local')->mimeType($edital->arquivo_path);

        return Storage::disk('local')->response(
            $edital->arquivo_path,
            $nome,
            [
                'Content-Type' => $mime,
                'Content-Disposition' => 'inline; filename="'.addslashes($nome).'"',
            ],
        );
    }

    public function uploadArquivo(Request $request, Edital $edital): JsonResponse
    {
        $request->validate([
            'arquivo' => ['required', 'file', 'mimes:pdf,txt,doc,docx', 'max:51200'],
        ]);

        if ($edital->arquivo_path) {
            Storage::disk('local')->delete($edital->arquivo_path);
        }

        $file = $request->file('arquivo');
        $path = $file->store("editais/{$edital->id}");

        $edital->update([
            'arquivo_path' => $path,
            'arquivo_nome_original' => $file->getClientOriginalName(),
            'arquivo_mime' => $file->getMimeType(),
            'arquivo_tamanho' => $file->getSize(),
        ]);

        $edital->refresh();
        $config = $this->aiService->ensureConfig($edital);

        $analysis = null;
        if ($config->enabled && $config->auto_analyze_on_upload) {
            $analysis = $this->aiService->queueAnalysis($edital);
        }

        return response()->json([
            'edital' => $edital->load(['aiConfig', 'ultimaAnalise']),
            'analise' => $analysis,
        ]);
    }
}
