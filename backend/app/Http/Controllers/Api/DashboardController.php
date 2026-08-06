<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Assinatura\DocumentoAssinatura;
use App\Models\Helpdesk\Ticket;
use App\Models\Licitacao\Edital;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $today = now()->startOfDay();
        $todayStr = $today->toDateString();
        $inTwoDays = $today->copy()->addDays(2)->toDateString();

        $totalEditais = Edital::count();
        $editaisAbertos = Edital::query()
            ->whereNotIn('status', ['encerrado', 'cancelado'])
            ->count();

        $encerrandoEm2Dias = Edital::query()
            ->whereNotIn('status', ['encerrado', 'cancelado'])
            ->whereNotNull('data_encerramento')
            ->whereBetween('data_encerramento', [$todayStr, $inTwoDays])
            ->count();

        $analisesPendentes = Edital::query()
            ->whereNotIn('status', ['cancelado'])
            ->where(function ($query) {
                $query->whereDoesntHave('ultimaAnalise')
                    ->orWhereHas('ultimaAnalise', function ($inner) {
                        $inner->whereIn('status', ['queued', 'pending', 'processing']);
                    });
            })
            ->count();

        $analisesErro = Edital::query()
            ->whereHas('ultimaAnalise', function ($query) {
                $query->whereIn('status', ['error', 'failed']);
            })
            ->count();

        $editalColumns = [
            'id',
            'titulo',
            'numero',
            'orgao',
            'status',
            'segmento',
            'modalidade',
            'data_abertura',
            'data_encerramento',
            'destacado',
        ];

        $editaisDestacados = Edital::query()
            ->where('destacado', true)
            ->orderByRaw('CASE WHEN COALESCE(data_encerramento, data_abertura) IS NULL THEN 1 ELSE 0 END')
            ->orderByRaw('COALESCE(data_encerramento, data_abertura) ASC')
            ->limit(10)
            ->get($editalColumns);

        $proximosEditais = Edital::query()
            ->whereNotIn('status', ['encerrado', 'cancelado'])
            ->where(function ($query) use ($todayStr) {
                $query->whereRaw('COALESCE(data_encerramento, data_abertura) >= ?', [$todayStr])
                    ->orWhere(function ($inner) {
                        $inner->whereNull('data_encerramento')
                            ->whereNull('data_abertura');
                    });
            })
            ->orderByRaw('CASE WHEN COALESCE(data_encerramento, data_abertura) IS NULL THEN 1 ELSE 0 END')
            ->orderByRaw('COALESCE(data_encerramento, data_abertura) ASC')
            ->limit(8)
            ->get($editalColumns);

        $atencaoPorPrazo = Edital::query()
            ->whereNotIn('status', ['encerrado', 'cancelado'])
            ->whereNotNull('data_encerramento')
            ->whereBetween('data_encerramento', [$todayStr, $inTwoDays])
            ->orderBy('data_encerramento')
            ->limit(5)
            ->get($editalColumns);

        $atencaoPorErro = Edital::query()
            ->with('ultimaAnalise')
            ->whereHas('ultimaAnalise', function ($query) {
                $query->whereIn('status', ['error', 'failed']);
            })
            ->latest()
            ->limit(5)
            ->get($editalColumns);

        $atencaoEditais = $atencaoPorPrazo
            ->concat($atencaoPorErro)
            ->unique('id')
            ->take(5)
            ->values()
            ->map(function (Edital $edital) use ($todayStr, $inTwoDays) {
                $analiseStatus = $edital->ultimaAnalise?->status;
                $encerramento = $edital->data_encerramento?->toDateString();
                $prazoCritico = $encerramento
                    && $encerramento >= $todayStr
                    && $encerramento <= $inTwoDays;

                $motivo = match (true) {
                    in_array($analiseStatus, ['error', 'failed'], true) => 'analise_erro',
                    $prazoCritico => 'prazo',
                    default => 'prazo',
                };

                return [
                    'id' => $edital->id,
                    'titulo' => $edital->titulo,
                    'numero' => $edital->numero,
                    'orgao' => $edital->orgao,
                    'status' => $edital->status,
                    'segmento' => $edital->segmento,
                    'modalidade' => $edital->modalidade,
                    'data_abertura' => $edital->data_abertura?->toDateString(),
                    'data_encerramento' => $encerramento,
                    'motivo' => $motivo,
                    'analise_status' => $analiseStatus,
                ];
            });

        return response()->json([
            'editais' => [
                'total' => $totalEditais,
                'abertos' => $editaisAbertos,
                'encerrando_em_2_dias' => $encerrandoEm2Dias,
                'analises_pendentes' => $analisesPendentes,
                'analises_erro' => $analisesErro,
            ],
            'helpdesk' => [
                'total_tickets' => Ticket::count(),
                'abertos' => Ticket::query()
                    ->whereNotIn('status', ['resolved', 'closed', 'cancelled'])
                    ->count(),
            ],
            'assinatura' => [
                'total_documentos' => DocumentoAssinatura::count(),
                'pendentes' => DocumentoAssinatura::query()->where('status', 'pendente')->count(),
            ],
            'proximos_editais' => $proximosEditais,
            'atencao_editais' => $atencaoEditais,
            'editais_destacados' => $editaisDestacados,
            'total_editais' => $totalEditais,
        ]);
    }
}
