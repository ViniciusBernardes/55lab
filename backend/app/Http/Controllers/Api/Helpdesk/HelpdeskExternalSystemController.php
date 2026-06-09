<?php

namespace App\Http\Controllers\Api\Helpdesk;

use App\Http\Controllers\Controller;
use App\Http\Requests\Helpdesk\StoreHelpdeskExternalSystemRequest;
use App\Http\Requests\Helpdesk\UpdateHelpdeskExternalSystemRequest;
use App\Models\Helpdesk\HelpdeskExternalSystem;
use App\Services\Helpdesk\HelpdeskExternalSystemService;
use Illuminate\Http\JsonResponse;

class HelpdeskExternalSystemController extends Controller
{
    public function __construct(
        private readonly HelpdeskExternalSystemService $service,
    ) {}

    public function index(): JsonResponse
    {
        $systems = HelpdeskExternalSystem::query()
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $systems]);
    }

    public function store(StoreHelpdeskExternalSystemRequest $request): JsonResponse
    {
        $system = $this->service->create($request->validated());

        return response()->json($system, 201);
    }

    public function show(HelpdeskExternalSystem $helpdeskExternalSystem): JsonResponse
    {
        return response()->json($helpdeskExternalSystem);
    }

    public function update(
        UpdateHelpdeskExternalSystemRequest $request,
        HelpdeskExternalSystem $helpdeskExternalSystem,
    ): JsonResponse {
        $system = $this->service->update($helpdeskExternalSystem, $request->validated());

        return response()->json($system);
    }

    public function destroy(HelpdeskExternalSystem $helpdeskExternalSystem): JsonResponse
    {
        $this->service->delete($helpdeskExternalSystem);

        return response()->json(['message' => 'Sistema externo removido.']);
    }

    public function test(HelpdeskExternalSystem $helpdeskExternalSystem): JsonResponse
    {
        $result = $this->service->testWebhook($helpdeskExternalSystem);

        return response()->json($result, $result['success'] ? 200 : 422);
    }
}
