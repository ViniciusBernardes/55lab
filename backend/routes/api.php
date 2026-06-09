<?php

use App\Http\Controllers\Api\Helpdesk\HelpdeskExternalSystemController;
use App\Http\Controllers\Api\Helpdesk\ExternalTicketController;
use App\Http\Controllers\Api\Helpdesk\TicketController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\Licitacao\EditalAiConfigController;
use App\Http\Controllers\Api\Licitacao\EditalAnaliseController;
use App\Http\Controllers\Api\Licitacao\EditalController;
use App\Http\Controllers\Api\Licitacao\IaCredencialController;
use Illuminate\Support\Facades\Route;

Route::get('/csrf-cookie', fn () => response()->noContent())->middleware('web');

Route::middleware('web')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/user', [AuthController::class, 'user']);
        Route::get('/dashboard', [DashboardController::class, 'index']);
    });
});

Route::prefix('licitacao')->middleware(['web', 'auth'])->group(function () {
    Route::get('credenciais/openai', [IaCredencialController::class, 'showOpenAi']);
    Route::put('credenciais/openai', [IaCredencialController::class, 'updateOpenAi']);
    Route::post('credenciais/openai/testar', [IaCredencialController::class, 'testOpenAi']);

    Route::post('editais/importar', [EditalController::class, 'importar']);
    Route::apiResource('editais', EditalController::class);

    Route::get('editais/{edital}/arquivo', [EditalController::class, 'downloadArquivo']);
    Route::post('editais/{edital}/arquivo', [EditalController::class, 'uploadArquivo']);

    Route::get('editais/{edital}/config-ia', [EditalAiConfigController::class, 'show']);
    Route::put('editais/{edital}/config-ia', [EditalAiConfigController::class, 'update']);

    Route::get('editais/{edital}/analises', [EditalAnaliseController::class, 'index']);
    Route::post('editais/{edital}/analisar', [EditalAnaliseController::class, 'store']);

    Route::get('analises/{analise}', [EditalAnaliseController::class, 'show']);
    Route::post('analises/{analise}/revisar', [EditalAnaliseController::class, 'review']);
});

Route::prefix('helpdesk')->group(function () {
    Route::post('tickets/external', [ExternalTicketController::class, 'store'])
        ->middleware('helpdesk.external_api');
});

Route::prefix('helpdesk')->middleware(['web', 'auth'])->group(function () {
    Route::get('external-systems', [HelpdeskExternalSystemController::class, 'index']);
    Route::post('external-systems', [HelpdeskExternalSystemController::class, 'store']);
    Route::get('external-systems/{helpdesk_external_system}', [HelpdeskExternalSystemController::class, 'show']);
    Route::put('external-systems/{helpdesk_external_system}', [HelpdeskExternalSystemController::class, 'update']);
    Route::delete('external-systems/{helpdesk_external_system}', [HelpdeskExternalSystemController::class, 'destroy']);
    Route::post('external-systems/{helpdesk_external_system}/test', [HelpdeskExternalSystemController::class, 'test']);

    Route::get('tickets', [TicketController::class, 'index']);
    Route::get('tickets/{ticket}', [TicketController::class, 'show']);
    Route::post('tickets/{ticket}/interactions', [TicketController::class, 'storeInteraction']);
    Route::patch('tickets/{ticket}/status', [TicketController::class, 'updateStatus']);
    Route::patch('tickets/{ticket}/assign', [TicketController::class, 'assign']);
    Route::get('tickets/{ticket}/history', [TicketController::class, 'history']);
    Route::get('tickets/{ticket}/attachment', [TicketController::class, 'downloadAttachment']);
});
