<?php

namespace App\Http\Controllers\Api\Assinatura;

use App\Http\Controllers\Controller;
use App\Http\Requests\Assinatura\AssinarDocumentoRequest;
use App\Http\Requests\Assinatura\StoreDocumentoAssinaturaRequest;
use App\Models\Assinatura\DocumentoAssinatura;
use App\Services\Assinatura\CertificadoDigitalService;
use App\Services\Assinatura\DocumentoAssinaturaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DocumentoAssinaturaController extends Controller
{
    public function __construct(
        private readonly DocumentoAssinaturaService $service,
        private readonly CertificadoDigitalService $certificadoService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = DocumentoAssinatura::query()
            ->with('assinaturas')
            ->where('user_id', $request->user()->id);

        if ($status = $request->string('status')->toString()) {
            $query->where('status', $status);
        }

        if ($search = $request->string('q')->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('titulo', 'like', "%{$search}%")
                    ->orWhere('codigo_verificacao', 'like', "%{$search}%");
            });
        }

        $documentos = $query->latest()->paginate($request->integer('per_page', 15));

        return response()->json($documentos);
    }

    public function store(StoreDocumentoAssinaturaRequest $request): JsonResponse
    {
        $documento = $this->service->upload(
            $request->file('arquivo'),
            $request->string('titulo')->toString(),
            $request->user()->id,
        );

        return response()->json(
            $documento->load('assinaturas'),
            201,
        );
    }

    public function show(DocumentoAssinatura $documento): JsonResponse
    {
        $this->authorizeDocumento($documento);

        return response()->json(
            $documento->load('assinaturas'),
        );
    }

    public function assinar(AssinarDocumentoRequest $request, DocumentoAssinatura $documento): JsonResponse
    {
        $this->authorizeDocumento($documento);

        if ($request->filled('certificado_id')) {
            $resolved = $this->certificadoService->resolveForSigning(
                $request->user()->id,
                $request->integer('certificado_id'),
                $request->string('senha')->toString() ?: null,
            );

            $documento = $this->service->assinarComPfx(
                $documento,
                $resolved['pfx'],
                $resolved['senha'],
                $request->string('papel', 'Parte')->toString(),
            );
        } else {
            $documento = $this->service->assinar(
                $documento,
                $request->file('certificado'),
                $request->string('senha')->toString(),
                $request->string('papel', 'Parte')->toString(),
            );
        }

        return response()->json($documento);
    }

    public function verificar(string $codigo): JsonResponse
    {
        $resultado = $this->service->verificar($codigo);

        if (! $resultado) {
            return response()->json([
                'message' => 'Código de verificação não encontrado.',
            ], 404);
        }

        return response()->json($resultado);
    }

    public function downloadOriginal(DocumentoAssinatura $documento): StreamedResponse
    {
        $this->authorizeDocumento($documento);

        return Storage::disk('local')->download(
            $documento->arquivo_original_path,
            $documento->arquivo_original_nome,
        );
    }

    public function downloadAssinado(DocumentoAssinatura $documento): StreamedResponse
    {
        $this->authorizeDocumento($documento);

        if (! $documento->arquivo_assinado_path) {
            abort(404, 'Documento ainda não foi assinado.');
        }

        $filename = pathinfo($documento->arquivo_original_nome, PATHINFO_FILENAME).'_assinado.pdf';

        return Storage::disk('local')->download(
            $documento->arquivo_assinado_path,
            $filename,
        );
    }

    public function destroy(DocumentoAssinatura $documento): JsonResponse
    {
        $this->authorizeDocumento($documento);

        if ($documento->arquivo_original_path) {
            Storage::disk('local')->delete($documento->arquivo_original_path);
        }
        if ($documento->arquivo_assinado_path) {
            Storage::disk('local')->delete($documento->arquivo_assinado_path);
        }

        foreach ($documento->assinaturas as $assinatura) {
            if ($assinatura->assinatura_pkcs7_path) {
                Storage::disk('local')->delete($assinatura->assinatura_pkcs7_path);
            }
        }

        $documento->delete();

        return response()->json(null, 204);
    }

    public function papeis(): JsonResponse
    {
        return response()->json([
            'papeis' => config('assinatura.papeis'),
        ]);
    }

    private function authorizeDocumento(DocumentoAssinatura $documento): void
    {
        if ($documento->user_id !== request()->user()?->id) {
            abort(403, 'Acesso negado a este documento.');
        }
    }
}
