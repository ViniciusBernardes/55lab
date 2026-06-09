<?php

namespace App\Http\Controllers\Api\Helpdesk;

use App\Http\Controllers\Controller;
use App\Http\Requests\Helpdesk\StoreExternalTicketRequest;
use App\Services\Helpdesk\TicketService;
use Illuminate\Http\JsonResponse;
use InvalidArgumentException;

class ExternalTicketController extends Controller
{
    public function __construct(private readonly TicketService $ticketService) {}

    public function store(StoreExternalTicketRequest $request): JsonResponse
    {
        $payload = $request->ticketPayload();

        $existing = $this->ticketService->findDuplicate(
            $payload['external_system'],
            $payload['external_id'],
        );

        if ($existing) {
            return response()->json([
                'message' => 'Ticket já registrado para este external_id.',
                'ticket' => $existing,
            ], 409);
        }

        try {
            $ticket = $this->ticketService->createFromExternal(
                $payload,
                $request->sanitizedPayload(),
                $request->attachmentPayload(),
            );
        } catch (InvalidArgumentException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        return response()->json($ticket, 201);
    }
}
