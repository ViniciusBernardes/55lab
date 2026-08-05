<?php

namespace App\Jobs;

use App\Models\Licitacao\EditalAlertaImport;
use App\Services\Licitacao\Alerta\AlertaEditalImportService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProcessAlertaEditalImportJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 900;

    public int $tries = 1;

    public function __construct(public int $importId) {}

    public function handle(AlertaEditalImportService $service): void
    {
        $import = EditalAlertaImport::query()->find($this->importId);
        if (! $import) {
            return;
        }

        $service->process($import);
    }
}
