<?php

namespace App\Services\Licitacao\Alerta\Parsers;

use App\Services\Licitacao\Alerta\AlertaOpportunity;
use App\Services\Licitacao\Alerta\AlertaUrlHelper;
use App\Services\Licitacao\Alerta\EditalSegmentoMatcher;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use RuntimeException;

class OportunidadesXlsxParser
{
    private const REQUIRED_HEADERS = [
        'Número da Compra',
        'Objeto da Compra',
        'Data Encerramento Proposta',
        'Número de Controle PNCP',
    ];

    public function __construct(
        private readonly AlertaUrlHelper $urls,
        private readonly EditalSegmentoMatcher $segmentos,
    ) {}

    public function supports(string $absolutePath): bool
    {
        $ext = strtolower(pathinfo($absolutePath, PATHINFO_EXTENSION));
        if (! in_array($ext, ['xlsx', 'xlsm', 'xls'], true)) {
            return false;
        }

        try {
            $headers = $this->readHeaderRow($absolutePath);

            return $this->hasRequiredHeaders($headers);
        } catch (\Throwable) {
            return false;
        }
    }

    /**
     * Filtra oportunidades cuja data de encerramento (sem hora) é hoje + N dias.
     *
     * @return list<AlertaOpportunity>
     */
    public function parse(string $absolutePath, ?CarbonInterface $today = null, ?int $encerramentoOffsetDays = null): array
    {
        $today = ($today ?? Carbon::today())->startOfDay();
        $offset = $encerramentoOffsetDays
            ?? (int) config('edital_alerta.oportunidades_encerramento_offset_days', 2);
        $targetDate = $today->copy()->addDays($offset)->toDateString();

        $spreadsheet = IOFactory::load($absolutePath);
        $sheet = $spreadsheet->getActiveSheet();
        $rows = $sheet->toArray(null, true, true, false);

        if ($rows === []) {
            throw new RuntimeException('Planilha de oportunidades vazia.');
        }

        $header = array_map(fn ($value) => trim((string) $value), $rows[0]);
        if (! $this->hasRequiredHeaders($header)) {
            throw new RuntimeException(
                'Planilha não reconhecida. Esperado cabeçalho com Número da Compra, Objeto da Compra, Data Encerramento Proposta e Número de Controle PNCP.'
            );
        }

        $index = $this->headerIndex($header);
        $opportunities = [];

        for ($i = 1, $count = count($rows); $i < $count; $i++) {
            $row = $rows[$i];
            $objeto = trim((string) ($this->cell($row, $index['objeto']) ?? ''));
            $pncp = trim((string) ($this->cell($row, $index['pncp']) ?? ''));
            if ($objeto === '' || $pncp === '') {
                continue;
            }

            $encerramento = $this->parseDateTime($this->cell($row, $index['encerramento']));
            if ($encerramento === null || $encerramento['date'] !== $targetDate) {
                continue;
            }

            if ($this->isSrp($this->cell($row, $index['srp']))) {
                continue;
            }

            $abertura = $this->parseDateTime($this->cell($row, $index['abertura']));
            $matched = $this->segmentos->match($objeto);
            if ($matched === []) {
                continue;
            }
            $link = $this->normalizeLink($this->cell($row, $index['link']));
            $parsedPncp = $this->urls->parsePncpControle($pncp);

            $numeroCompra = trim((string) ($this->cell($row, $index['numero']) ?? ''));
            $ano = trim((string) ($this->cell($row, $index['ano']) ?? ''));
            $numero = $numeroCompra !== ''
                ? ($ano !== '' ? "{$numeroCompra}/{$ano}" : $numeroCompra)
                : ($parsedPncp['sequencial'] ?? null);

            $opportunities[] = new AlertaOpportunity(
                fonte: 'pncp',
                objeto: $objeto,
                orgao: $this->nullableString($this->cell($row, $index['unidade'])),
                numero: is_string($numero) || is_int($numero) ? (string) $numero : null,
                modalidade: $this->nullableString($this->cell($row, $index['modalidade'])),
                dataAbertura: $abertura['date'] ?? null,
                horaAbertura: $abertura['time'] ?? null,
                dataEncerramento: $encerramento['date'],
                linkProcesso: $link ?: ($parsedPncp
                    ? $this->urls->pncpEditalUrl($parsedPncp['cnpj'], $parsedPncp['ano'], $parsedPncp['sequencial'])
                    : null),
                segmento: $matched[0] ?? null,
                segmentos: $matched,
                uf: $this->nullableString($this->cell($row, $index['uf'])),
                municipio: $this->nullableString($this->cell($row, $index['municipio'])),
                pncpControle: $pncp,
            );
        }

        return $opportunities;
    }

    /** @return list<string> */
    private function readHeaderRow(string $absolutePath): array
    {
        $spreadsheet = IOFactory::load($absolutePath);
        $row = $spreadsheet->getActiveSheet()->rangeToArray('A1:Q1', null, true, true, false)[0] ?? [];

        return array_map(fn ($value) => trim((string) $value), $row);
    }

    /** @param  list<string>  $headers */
    private function hasRequiredHeaders(array $headers): bool
    {
        foreach (self::REQUIRED_HEADERS as $required) {
            if (! in_array($required, $headers, true)) {
                return false;
            }
        }

        return true;
    }

    /**
     * @param  list<string>  $header
     * @return array{
     *   numero: ?int,
     *   ano: ?int,
     *   modalidade: ?int,
     *   objeto: int,
     *   unidade: ?int,
     *   municipio: ?int,
     *   uf: ?int,
     *   srp: ?int,
     *   abertura: ?int,
     *   encerramento: int,
     *   pncp: int,
     *   link: ?int
     * }
     */
    private function headerIndex(array $header): array
    {
        $map = array_flip($header);

        return [
            'numero' => $map['Número da Compra'] ?? null,
            'ano' => $map['Ano'] ?? null,
            'modalidade' => $map['Modalidade'] ?? null,
            'objeto' => $map['Objeto da Compra'],
            'unidade' => $map['Unidade'] ?? null,
            'municipio' => $map['Município'] ?? null,
            'uf' => $map['UF'] ?? null,
            'srp' => $map['SRP'] ?? null,
            'abertura' => $map['Data Abertura Proposta'] ?? null,
            'encerramento' => $map['Data Encerramento Proposta'],
            'pncp' => $map['Número de Controle PNCP'],
            'link' => $map['Link Sistema Origem'] ?? null,
        ];
    }

    private function isSrp(mixed $value): bool
    {
        $raw = mb_strtolower(trim((string) ($value ?? '')));

        return in_array($raw, ['sim', 's', 'yes', '1', 'true'], true);
    }

    /** @param  list<mixed>  $row */
    private function cell(array $row, ?int $index): mixed
    {
        if ($index === null || ! array_key_exists($index, $row)) {
            return null;
        }

        return $row[$index];
    }

    /**
     * @return array{date: string, time: ?string}|null
     */
    private function parseDateTime(mixed $value): ?array
    {
        if ($value === null || $value === '') {
            return null;
        }

        try {
            if ($value instanceof \DateTimeInterface) {
                $carbon = Carbon::instance(\DateTimeImmutable::createFromInterface($value));
            } elseif (is_numeric($value)) {
                $carbon = Carbon::instance(ExcelDate::excelToDateTimeObject((float) $value));
            } else {
                $raw = trim((string) $value);
                $carbon = null;
                foreach (['d/m/Y H:i:s', 'd/m/Y H:i', 'd/m/Y'] as $format) {
                    try {
                        $carbon = Carbon::createFromFormat($format, $raw);
                        break;
                    } catch (\Throwable) {
                        // tenta próximo formato
                    }
                }
                $carbon ??= Carbon::parse($raw);
            }
        } catch (\Throwable) {
            return null;
        }

        $time = $carbon->format('H:i');
        if ($time === '00:00' && ! preg_match('/\d{1,2}:\d{2}/', (string) $value)) {
            $time = null;
        }

        return [
            'date' => $carbon->toDateString(),
            'time' => $time,
        ];
    }

    private function normalizeLink(mixed $value): ?string
    {
        $link = trim((string) ($value ?? ''));
        if ($link === '') {
            return null;
        }

        if (! preg_match('#^https?://#i', $link)) {
            $link = 'https://'.$link;
        }

        return $this->urls->unwrapTrackingUrl($link);
    }

    private function nullableString(mixed $value): ?string
    {
        $text = trim((string) ($value ?? ''));

        return $text !== '' ? $text : null;
    }
}
