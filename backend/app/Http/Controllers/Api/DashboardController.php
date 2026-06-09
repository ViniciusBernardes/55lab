<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Licitacao\Edital;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $today = now()->toDateString();

        $proximosEditais = Edital::query()
            ->whereNotIn('status', ['encerrado', 'cancelado'])
            ->where(function ($query) use ($today) {
                $query->whereRaw('COALESCE(data_encerramento, data_abertura) >= ?', [$today])
                    ->orWhere(function ($inner) {
                        $inner->whereNull('data_encerramento')
                            ->whereNull('data_abertura');
                    });
            })
            ->orderByRaw('CASE WHEN COALESCE(data_encerramento, data_abertura) IS NULL THEN 1 ELSE 0 END')
            ->orderByRaw('COALESCE(data_encerramento, data_abertura) ASC')
            ->limit(8)
            ->get([
                'id',
                'titulo',
                'numero',
                'orgao',
                'status',
                'data_abertura',
                'data_encerramento',
            ]);

        return response()->json([
            'total_editais' => Edital::count(),
            'proximos_editais' => $proximosEditais,
        ]);
    }
}
