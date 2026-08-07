<?php

namespace App\Services\Licitacao\Alerta;

use App\Jobs\ProcessAlertaEditalImportJob;
use App\Models\Licitacao\Edital;
use App\Models\Licitacao\EditalAlertaImport;
use App\Services\Licitacao\Alerta\Fetchers\PortalEditalFetcher;
use App\Services\Licitacao\Alerta\Parsers\BllAlertaParser;
use App\Services\Licitacao\Alerta\Parsers\OportunidadesXlsxParser;
use App\Services\Licitacao\Alerta\Parsers\PcpAlertaParser;
use App\Services\Licitacao\EditalAiService;
use App\Services\Licitacao\IaCredencialService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class AlertaEditalImportService
{
    public function __construct(
        private readonly AlertaPdfReader $pdfReader,
        private readonly PcpAlertaParser $pcpParser,
        private readonly BllAlertaParser $bllParser,
        private readonly OportunidadesXlsxParser $xlsxParser,
        private readonly PortalEditalFetcher $fetcher,
        private readonly EditalAiService $aiService,
        private readonly IaCredencialService $credencialService,
        private readonly EditalSegmentoMatcher $segmentos,
        private readonly AlertaUrlHelper $urls,
    ) {}

    /**
     * @param  list<string>|null  $segmentos
     */
    public function queueImport(UploadedFile $file, ?array $segmentos = null): EditalAlertaImport
    {
        if (! $this->credencialService->isOpenAiConfigured()) {
            throw new RuntimeException('Configure as credenciais OpenAI antes de importar alertas.');
        }

        $segmentos = $this->normalizeSegmentos($segmentos);

        $import = EditalAlertaImport::create([
            'status' => 'queued',
            'arquivo_nome_original' => $file->getClientOriginalName(),
            'segmentos' => $segmentos,
        ]);

        $path = $file->store("alertas/{$import->id}");
        $import->update(['arquivo_path' => $path]);

        ProcessAlertaEditalImportJob::dispatch($import->id);

        return $import->fresh();
    }

    public function process(EditalAlertaImport $import): EditalAlertaImport
    {
        $import->update([
            'status' => 'processing',
            'error_message' => null,
        ]);

        try {
            if (! $import->arquivo_path || ! Storage::disk('local')->exists($import->arquivo_path)) {
                throw new RuntimeException('Arquivo de alerta não encontrado.');
            }

            $absolute = Storage::disk('local')->path($import->arquivo_path);
            $segmentos = $this->normalizeSegmentos($import->segmentos);

            [$allOpportunities, $fonteDetectada] = $this->extractFromFile($absolute);

            $opportunities = array_values(array_filter(
                $allOpportunities,
                fn (AlertaOpportunity $item) => ! $this->segmentos->shouldExclude($item->objeto)
                    && $item->segmentos !== []
                    && array_intersect($item->segmentos, $segmentos) !== [],
            ));

            // prioriza o primeiro segmento permitido
            $opportunities = array_map(function (AlertaOpportunity $item) use ($segmentos) {
                $matched = array_values(array_intersect($item->segmentos, $segmentos));

                return new AlertaOpportunity(
                    fonte: $item->fonte,
                    objeto: $item->objeto,
                    orgao: $item->orgao,
                    numero: $item->numero,
                    modalidade: $item->modalidade,
                    dataAbertura: $item->dataAbertura,
                    horaAbertura: $item->horaAbertura,
                    dataEncerramento: $item->dataEncerramento,
                    linkProcesso: $item->linkProcesso,
                    segmento: $matched[0] ?? $item->segmento,
                    segmentos: $matched,
                    uf: $item->uf,
                    municipio: $item->municipio,
                    pncpControle: $item->pncpControle,
                );
            }, $opportunities);

            $resultado = [];
            $importados = 0;
            $erros = 0;

            foreach ($opportunities as $opportunity) {
                try {
                    $edital = $this->importOpportunity($import, $opportunity);
                    $importados++;
                    $resultado[] = [
                        'status' => 'imported',
                        'edital_id' => $edital->id,
                        'segmento' => $opportunity->segmento,
                        'objeto' => Str::limit($opportunity->objeto, 180, ''),
                        'orgao' => $opportunity->orgao,
                        'link_processo' => $opportunity->linkProcesso,
                        'pncp_controle' => $opportunity->pncpControle,
                    ];
                } catch (\Throwable $e) {
                    $erros++;
                    $resultado[] = [
                        'status' => 'error',
                        'segmento' => $opportunity->segmento,
                        'objeto' => Str::limit($opportunity->objeto, 180, ''),
                        'orgao' => $opportunity->orgao,
                        'link_processo' => $opportunity->linkProcesso,
                        'pncp_controle' => $opportunity->pncpControle,
                        'error' => $e->getMessage(),
                    ];
                }
            }

            $fonte = $opportunities[0]->fonte ?? $fonteDetectada;

            $import->update([
                'fonte' => $fonte,
                'status' => 'completed',
                'total_encontrados' => count($allOpportunities),
                'total_filtrados' => count($opportunities),
                'total_importados' => $importados,
                'total_erros' => $erros,
                'resultado' => $resultado,
            ]);
        } catch (\Throwable $e) {
            $import->update([
                'status' => 'error',
                'error_message' => $e->getMessage(),
            ]);
        }

        return $import->fresh();
    }

    /**
     * @return array{0: list<AlertaOpportunity>, 1: ?string}
     */
    private function extractFromFile(string $absolutePath): array
    {
        $ext = strtolower(pathinfo($absolutePath, PATHINFO_EXTENSION));

        if (in_array($ext, ['xlsx', 'xlsm', 'xls'], true)) {
            if (! $this->xlsxParser->supports($absolutePath)) {
                throw new RuntimeException(
                    'Planilha não reconhecida. Envie o arquivo de oportunidades no formato esperado (colunas PNCP).'
                );
            }

            return [$this->xlsxParser->parse($absolutePath), 'pncp'];
        }

        $parsed = $this->pdfReader->read($absolutePath);
        $opportunities = $this->extractOpportunities($parsed['text'], $parsed['links']);

        return [$opportunities, $this->detectFonte($parsed['text'], $parsed['links'])];
    }

    /**
     * @param  list<string>  $links
     * @return list<AlertaOpportunity>
     */
    public function extractOpportunities(string $text, array $links): array
    {
        if ($this->bllParser->supports($text, $links)) {
            return $this->bllParser->parse($text, $links);
        }

        if ($this->pcpParser->supports($text, $links)) {
            return $this->pcpParser->parse($text, $links);
        }

        throw new RuntimeException(
            'Formato de alerta não reconhecido. Envie PDF do Portal de Compras Públicas/BLL ou planilha de oportunidades (.xlsx).'
        );
    }

    private function importOpportunity(EditalAlertaImport $import, AlertaOpportunity $opportunity): Edital
    {
        if ($opportunity->linkProcesso) {
            $existing = Edital::query()
                ->where('link_origem', $opportunity->linkProcesso)
                ->first();
            if ($existing) {
                return $this->applyAutoHighlight($existing, $opportunity->objeto);
            }
        }

        if ($opportunity->pncpControle) {
            $parsed = $this->urls->parsePncpControle($opportunity->pncpControle);
            if ($parsed) {
                $pncpUrl = $this->urls->pncpEditalUrl(
                    $parsed['cnpj'],
                    $parsed['ano'],
                    $parsed['sequencial'],
                );
                $existing = Edital::query()
                    ->where('link_origem', $pncpUrl)
                    ->first();
                if ($existing) {
                    return $this->applyAutoHighlight($existing, $opportunity->objeto);
                }
            }
        }

        $file = $this->fetcher->fetch($opportunity);

        $observacoes = [];
        if ($opportunity->segmento) {
            $observacoes[] = 'Segmento: '.$this->segmentos->label($opportunity->segmento);
        }
        if ($opportunity->pncpControle) {
            $observacoes[] = 'PNCP: '.$opportunity->pncpControle;
        }

        $destacado = $this->segmentos->shouldHighlight($opportunity->objeto);
        if ($destacado) {
            $observacoes[] = 'Destaque automático: protocolo eletrônico / WhatsApp';
        }

        $edital = Edital::create([
            'alerta_import_id' => $import->id,
            'titulo' => Str::limit($opportunity->objeto, 255, ''),
            'numero' => $opportunity->numero,
            'orgao' => $opportunity->orgao,
            'modalidade' => $opportunity->modalidade,
            'objeto' => $opportunity->objeto,
            'segmento' => $opportunity->segmento,
            'fonte' => $opportunity->fonte,
            'link_origem' => $opportunity->linkProcesso,
            'data_abertura' => $opportunity->dataAbertura,
            'hora_abertura' => $opportunity->horaAbertura,
            'data_encerramento' => $opportunity->dataEncerramento,
            'status' => 'rascunho',
            'destacado' => $destacado,
            'observacoes' => $observacoes !== [] ? implode(' | ', $observacoes) : null,
        ]);

        $relative = "editais/{$edital->id}/".$file['filename'];
        Storage::disk('local')->put($relative, $file['contents']);

        $edital->update([
            'arquivo_path' => $relative,
            'arquivo_nome_original' => $file['filename'],
            'arquivo_mime' => $file['mime'],
            'arquivo_tamanho' => strlen($file['contents']),
        ]);

        $this->aiService->ensureConfig($edital->fresh());
        $this->aiService->queueAnalysis($edital->fresh());

        return $edital->fresh()->load(['aiConfig', 'ultimaAnalise']);
    }

    private function applyAutoHighlight(Edital $edital, string $objeto): Edital
    {
        if (! $edital->destacado && $this->segmentos->shouldHighlight($objeto)) {
            $edital->update(['destacado' => true]);
        }

        return $edital->fresh()->load(['aiConfig', 'ultimaAnalise']);
    }

    /**
     * @param  list<string>|null  $segmentos
     * @return list<string>
     */
    private function normalizeSegmentos(?array $segmentos): array
    {
        $available = array_keys(config('edital_alerta.segmentos', []));
        $defaults = config('edital_alerta.default_segmentos', $available);
        $selected = $segmentos ?: $defaults;

        return array_values(array_intersect($selected, $available));
    }

    /** @param  list<string>  $links */
    private function detectFonte(string $text, array $links): ?string
    {
        if ($this->bllParser->supports($text, $links)) {
            return 'bll';
        }
        if ($this->pcpParser->supports($text, $links)) {
            return 'portal_compras_publicas';
        }

        return null;
    }
}
