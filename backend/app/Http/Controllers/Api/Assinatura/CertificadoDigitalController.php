<?php

namespace App\Http\Controllers\Api\Assinatura;

use App\Http\Controllers\Controller;
use App\Http\Requests\Assinatura\StoreCertificadoDigitalRequest;
use App\Models\Assinatura\CertificadoDigital;
use App\Services\Assinatura\CertificadoDigitalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CertificadoDigitalController extends Controller
{
    public function __construct(
        private readonly CertificadoDigitalService $service,
    ) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->service->listForUser($request->user()->id),
        ]);
    }

    public function store(StoreCertificadoDigitalRequest $request): JsonResponse
    {
        $certificado = $this->service->store(
            $request->user()->id,
            $request->file('certificado'),
            $request->string('senha')->toString(),
            $request->string('apelido')->toString(),
            $request->boolean('is_padrao'),
        );

        return response()->json($certificado->toPublicArray(), 201);
    }

    public function destroy(Request $request, CertificadoDigital $certificado): JsonResponse
    {
        $this->authorizeCertificado($request, $certificado);
        $this->service->destroy($certificado);

        return response()->json(null, 204);
    }

    public function setPadrao(Request $request, CertificadoDigital $certificado): JsonResponse
    {
        $this->authorizeCertificado($request, $certificado);
        $certificado = $this->service->setPadrao($certificado);

        return response()->json($certificado->toPublicArray());
    }

    private function authorizeCertificado(Request $request, CertificadoDigital $certificado): void
    {
        if ($certificado->user_id !== $request->user()?->id) {
            abort(403, 'Acesso negado a este certificado.');
        }
    }
}
