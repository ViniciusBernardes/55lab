<?php

namespace App\Http\Controllers\Api\Helpdesk;

use App\Http\Controllers\Controller;
use App\Http\Requests\Helpdesk\AssignTicketRequest;
use App\Http\Requests\Helpdesk\StoreTicketInteractionRequest;
use App\Http\Requests\Helpdesk\UpdateTicketStatusRequest;
use App\Models\Helpdesk\Ticket;
use App\Services\Helpdesk\TicketService;
use App\Services\Helpdesk\TicketStatusService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TicketController extends Controller
{
    public function __construct(
        private readonly TicketService $ticketService,
        private readonly TicketStatusService $statusService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json($this->ticketService->paginate($request));
    }

    public function show(Ticket $ticket): JsonResponse
    {
        return response()->json(
            $ticket->load([
                'assignee',
                'interactions.user',
                'statusHistories.changedBy',
            ]),
        );
    }

    public function storeInteraction(
        StoreTicketInteractionRequest $request,
        Ticket $ticket,
    ): JsonResponse {
        $interaction = $this->ticketService->addInteraction(
            $ticket,
            $request->validated('message'),
            $request->boolean('internal_only', true),
            $request->user(),
        );

        return response()->json($interaction, 201);
    }

    public function updateStatus(
        UpdateTicketStatusRequest $request,
        Ticket $ticket,
    ): JsonResponse {
        $ticket = $this->statusService->changeStatus(
            $ticket,
            $request->validated('status'),
            $request->user(),
            $request->validated('message'),
        );

        return response()->json($ticket);
    }

    public function assign(AssignTicketRequest $request, Ticket $ticket): JsonResponse
    {
        $ticket = $this->ticketService->assign(
            $ticket,
            $request->validated('assigned_to'),
        );

        return response()->json($ticket);
    }

    public function history(Ticket $ticket): JsonResponse
    {
        return response()->json(
            $ticket->statusHistories()->with('changedBy')->get(),
        );
    }

    public function downloadAttachment(Ticket $ticket): StreamedResponse|JsonResponse
    {
        if (! $ticket->hasAttachment() || ! Storage::disk('local')->exists($ticket->attachment_path)) {
            return response()->json(['message' => 'Anexo não encontrado.'], 404);
        }

        $filename = $ticket->attachment_filename ?: 'anexo';
        $mime = $ticket->attachment_mime ?: Storage::disk('local')->mimeType($ticket->attachment_path);

        return Storage::disk('local')->response(
            $ticket->attachment_path,
            $filename,
            ['Content-Type' => $mime],
        );
    }
}
