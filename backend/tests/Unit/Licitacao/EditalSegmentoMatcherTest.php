<?php

namespace Tests\Unit\Licitacao;

use App\Services\Licitacao\Alerta\EditalSegmentoMatcher;
use Tests\TestCase;

class EditalSegmentoMatcherTest extends TestCase
{
    public function test_matches_software_and_gestao_educacional(): void
    {
        $matcher = new EditalSegmentoMatcher;
        $texto = 'CONTRATAÇÃO DE SOLUÇÃO TECNOLÓGICA INTEGRADA DE GESTÃO EDUCACIONAL, NO MODELO SOFTWARE COMO SERVIÇO (SAAS)';

        $matched = $matcher->match($texto);

        $this->assertContains('software', $matched);
        $this->assertContains('gestao_educacional', $matched);
    }

    public function test_matches_protocolo(): void
    {
        $matcher = new EditalSegmentoMatcher;
        $matched = $matcher->match(
            'solução tecnológica destinada à gestão de processos administrativos e tramitação digital'
        );

        $this->assertContains('protocolo', $matched);
    }

    public function test_matches_cesta_de_preco(): void
    {
        $matcher = new EditalSegmentoMatcher;
        $matched = $matcher->match('Elaboração de cesta de preços para pesquisa de mercado');

        $this->assertSame(['cesta_de_preco'], $matched);
    }

    public function test_ignores_unrelated_objeto(): void
    {
        $matcher = new EditalSegmentoMatcher;
        $matched = $matcher->match('Aquisição de utensílios de copa e cozinha para alimentação escolar');

        $this->assertSame([], $matched);
    }

    public function test_excludes_registro_de_preco(): void
    {
        $matcher = new EditalSegmentoMatcher;
        $texto = 'Registro de Preços para eventual contratação de empresa especializada em solução integrada de sistema informatizado e software';

        $this->assertTrue($matcher->shouldExclude($texto));
        $this->assertSame([], $matcher->match($texto));
    }

    public function test_excludes_aquisicao_de_material(): void
    {
        $matcher = new EditalSegmentoMatcher;
        $texto = 'Aquisição de material permanente e de consumo, incluindo licenças de software auxiliares';

        $this->assertTrue($matcher->shouldExclude($texto));
        $this->assertSame([], $matcher->match($texto));
    }

    public function test_excludes_gestao_publica(): void
    {
        $matcher = new EditalSegmentoMatcher;
        $texto = 'Locação de software de gestão pública (programas de informática) na área administrativa';

        $this->assertTrue($matcher->shouldExclude($texto));
        $this->assertSame([], $matcher->match($texto));
    }

    public function test_keeps_software_without_gestao_publica(): void
    {
        $matcher = new EditalSegmentoMatcher;
        $texto = 'Contratação de licenças de software Adobe Creative Cloud em modelo SaaS';

        $this->assertFalse($matcher->shouldExclude($texto));
        $this->assertContains('software', $matcher->match($texto));
    }

    public function test_highlights_protocolo_eletronico(): void
    {
        $matcher = new EditalSegmentoMatcher;
        $texto = 'Contratação de sistema de protocolo eletrônico para tramitação digital de processos';

        $this->assertTrue($matcher->shouldHighlight($texto));
        $this->assertContains('protocolo', $matcher->match($texto));
    }

    public function test_highlights_api_whatsapp(): void
    {
        $matcher = new EditalSegmentoMatcher;
        $texto = 'Solução tecnológica com integração WhatsApp Business API para atendimento ao cidadão';

        $this->assertTrue($matcher->shouldHighlight($texto));
        $this->assertContains('software', $matcher->match($texto));
    }

    public function test_does_not_highlight_generic_software(): void
    {
        $matcher = new EditalSegmentoMatcher;
        $texto = 'Contratação de licenças de software Adobe Creative Cloud em modelo SaaS';

        $this->assertFalse($matcher->shouldHighlight($texto));
    }

    public function test_keeps_cesta_de_preco_without_registro(): void
    {
        $matcher = new EditalSegmentoMatcher;
        $matched = $matcher->match('Elaboração de cesta de preços para pesquisa de mercado');

        $this->assertSame(['cesta_de_preco'], $matched);
        $this->assertFalse($matcher->shouldExclude('Elaboração de cesta de preços para pesquisa de mercado'));
    }
}
