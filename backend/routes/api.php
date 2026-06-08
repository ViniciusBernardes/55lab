<?php

use App\Http\Controllers\Api\Licitacao\EditalAiConfigController;
use App\Http\Controllers\Api\Licitacao\EditalAnaliseController;
use App\Http\Controllers\Api\Licitacao\EditalController;
use App\Http\Controllers\Api\Licitacao\IaCredencialController;
use Illuminate\Support\Facades\Route;

Route::prefix('licitacao')->group(function () {
    Route::get('credenciais/openai', [IaCredencialController::class, 'showOpenAi']);
    Route::put('credenciais/openai', [IaCredencialController::class, 'updateOpenAi']);
    Route::post('credenciais/openai/testar', [IaCredencialController::class, 'testOpenAi']);

    Route::post('editais/importar', [EditalController::class, 'importar']);
    Route::apiResource('editais', EditalController::class);

    Route::post('editais/{edital}/arquivo', [EditalController::class, 'uploadArquivo']);

    Route::get('editais/{edital}/config-ia', [EditalAiConfigController::class, 'show']);
    Route::put('editais/{edital}/config-ia', [EditalAiConfigController::class, 'update']);

    Route::get('editais/{edital}/analises', [EditalAnaliseController::class, 'index']);
    Route::post('editais/{edital}/analisar', [EditalAnaliseController::class, 'store']);

    Route::get('analises/{analise}', [EditalAnaliseController::class, 'show']);
    Route::post('analises/{analise}/revisar', [EditalAnaliseController::class, 'review']);
});
