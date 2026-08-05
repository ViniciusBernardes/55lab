<?php

namespace App\Services\Licitacao\Alerta;

class AlertaOpportunity
{
    /**
     * @param  list<string>  $segmentos
     */
    public function __construct(
        public readonly string $fonte,
        public readonly string $objeto,
        public readonly ?string $orgao = null,
        public readonly ?string $numero = null,
        public readonly ?string $modalidade = null,
        public readonly ?string $dataAbertura = null,
        public readonly ?string $horaAbertura = null,
        public readonly ?string $dataEncerramento = null,
        public readonly ?string $linkProcesso = null,
        public readonly ?string $segmento = null,
        public readonly array $segmentos = [],
        public readonly ?string $uf = null,
        public readonly ?string $municipio = null,
        public readonly ?string $pncpControle = null,
    ) {}

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            'fonte' => $this->fonte,
            'objeto' => $this->objeto,
            'orgao' => $this->orgao,
            'numero' => $this->numero,
            'modalidade' => $this->modalidade,
            'data_abertura' => $this->dataAbertura,
            'hora_abertura' => $this->horaAbertura,
            'data_encerramento' => $this->dataEncerramento,
            'link_processo' => $this->linkProcesso,
            'segmento' => $this->segmento,
            'segmentos' => $this->segmentos,
            'uf' => $this->uf,
            'municipio' => $this->municipio,
            'pncp_controle' => $this->pncpControle,
        ];
    }
}
