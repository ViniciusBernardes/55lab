<?php

namespace Tests\Unit\Licitacao;

use App\Services\Licitacao\Alerta\AlertaUrlHelper;
use App\Services\Licitacao\Alerta\EditalSegmentoMatcher;
use App\Services\Licitacao\Alerta\Parsers\OportunidadesXlsxParser;
use Carbon\Carbon;
use Tests\TestCase;

class OportunidadesXlsxParserTest extends TestCase
{
    public function test_parses_and_filters_encerramento_hoje_mais_dois_dias(): void
    {
        $path = base_path('tests/fixtures/oportunidades_pncp.xlsx');
        $this->assertFileExists($path);

        $parser = new OportunidadesXlsxParser(new AlertaUrlHelper, new EditalSegmentoMatcher);
        $this->assertTrue($parser->supports($path));

        // Fixture tem linhas em 06/08/2026; com hoje=04/08, target = +2 = 06/08
        $items = $parser->parse($path, Carbon::parse('2026-08-04'));

        $this->assertGreaterThanOrEqual(5, count($items));

        foreach ($items as $item) {
            $this->assertSame('pncp', $item->fonte);
            $this->assertSame('2026-08-06', $item->dataEncerramento);
            $this->assertNotEmpty($item->pncpControle);
            $this->assertMatchesRegularExpression(
                '/^\d{14}-\d+-\d+\/\d{4}$/',
                (string) $item->pncpControle,
            );
        }

        $withSegment = array_values(array_filter(
            $items,
            fn ($item) => $item->segmentos !== [],
        ));
        $this->assertNotEmpty($withSegment);

        $software = array_values(array_filter(
            $items,
            fn ($item) => in_array('software', $item->segmentos, true),
        ));
        $this->assertNotEmpty($software);
    }

    public function test_returns_empty_when_no_rows_match_target_date(): void
    {
        $path = base_path('tests/fixtures/oportunidades_pncp.xlsx');
        $parser = new OportunidadesXlsxParser(new AlertaUrlHelper, new EditalSegmentoMatcher);

        $items = $parser->parse($path, Carbon::parse('2026-01-01'));
        $this->assertSame([], $items);
    }

    public function test_parse_pncp_controle_helper(): void
    {
        $urls = new AlertaUrlHelper;
        $parsed = $urls->parsePncpControle('00394452000103-1-015531/2026');

        $this->assertSame([
            'cnpj' => '00394452000103',
            'unidade' => 1,
            'sequencial' => 15531,
            'ano' => 2026,
        ], $parsed);

        $this->assertSame(
            'https://pncp.gov.br/app/editais/00394452000103/2026/15531',
            $urls->pncpEditalUrl($parsed['cnpj'], $parsed['ano'], $parsed['sequencial']),
        );
    }
}
