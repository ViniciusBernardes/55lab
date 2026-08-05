<?php

namespace Tests\Unit\Licitacao;

use App\Services\Licitacao\Alerta\AlertaPdfReader;
use App\Services\Licitacao\Alerta\AlertaUrlHelper;
use App\Services\Licitacao\Alerta\EditalSegmentoMatcher;
use App\Services\Licitacao\Alerta\Parsers\BllAlertaParser;
use App\Services\Licitacao\Alerta\Parsers\PcpAlertaParser;
use Tests\TestCase;

class AlertaPdfParsersTest extends TestCase
{
    public function test_parses_pcp_alerta_fixture(): void
    {
        $path = base_path('tests/fixtures/alerta_pcp.pdf');
        $this->assertFileExists($path);

        $reader = new AlertaPdfReader;
        $parsed = $reader->read($path);

        $parser = new PcpAlertaParser(new AlertaUrlHelper, new EditalSegmentoMatcher);
        $this->assertTrue($parser->supports($parsed['text'], $parsed['links']));

        $items = $parser->parse($parsed['text'], $parsed['links']);
        $this->assertGreaterThanOrEqual(10, count($items));

        $withSegment = array_filter($items, fn ($item) => $item->segmentos !== []);
        $this->assertNotEmpty($withSegment);

        $software = array_filter(
            $items,
            fn ($item) => in_array('software', $item->segmentos, true),
        );
        $this->assertNotEmpty($software);

        foreach ($software as $item) {
            $this->assertNotEmpty($item->linkProcesso);
            $this->assertStringContainsString('portaldecompraspublicas.com.br', (string) $item->linkProcesso);
        }
    }

    public function test_parses_bll_alerta_fixture(): void
    {
        $path = base_path('tests/fixtures/alerta_bll.pdf');
        $this->assertFileExists($path);

        $reader = new AlertaPdfReader;
        $parsed = $reader->read($path);

        $parser = new BllAlertaParser(new AlertaUrlHelper, new EditalSegmentoMatcher);
        $this->assertTrue($parser->supports($parsed['text'], $parsed['links']));

        $items = $parser->parse($parsed['text'], $parsed['links']);
        $this->assertGreaterThanOrEqual(8, count($items));

        $educacional = array_values(array_filter(
            $items,
            fn ($item) => in_array('gestao_educacional', $item->segmentos, true),
        ));
        $this->assertNotEmpty($educacional);
        $this->assertStringContainsStringIgnoringCase('educacional', $educacional[0]->objeto);

        $protocolo = array_values(array_filter(
            $items,
            fn ($item) => in_array('protocolo', $item->segmentos, true),
        ));
        $this->assertNotEmpty($protocolo);

        $withLinks = array_filter($items, fn ($item) => filled($item->linkProcesso));
        $this->assertGreaterThanOrEqual(8, count($withLinks));
    }
}
