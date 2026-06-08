<?php

namespace App\Jobs;

use App\Models\Licitacao\EditalAnalise;
use App\Services\Licitacao\EditalAiService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProcessEditalAiAnalysisJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 360;

    public function __construct(public int $analysisId) {}

    public function handle(EditalAiService $service): void
    {
        if (! $service->isEnabled()) {
            return;
        }

        $analysis = EditalAnalise::query()->with(['edital.aiConfig'])->find($this->analysisId);

        if (! $analysis) {
            return;
        }

        try {
            $service->runAnalysis($analysis);
        } catch (\Throwable $e) {
            $analysis->update([
                'status' => 'error',
                'error_message' => 'Falha no processamento de IA: '.$e->getMessage(),
            ]);
        }
    }
}
