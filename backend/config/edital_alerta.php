<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Segmentos monitorados nos alertas de licitação
    |--------------------------------------------------------------------------
    |
    | Cada chave é o identificador persistido em editais.segmento.
    | As palavras-chave são buscadas no objeto/título da oportunidade.
    |
    */
    'segmentos' => [
        'software' => [
            'label' => 'Software',
            'keywords' => [
                'software',
                'saas',
                's.a.a.s',
                'licenciamento',
                'licença de uso',
                'licenca de uso',
                'cessão onerosa de software',
                'cessao onerosa de software',
                'solução tecnológica',
                'solucao tecnologica',
                'solução integrada',
                'solucao integrada',
                'sistema integrado',
                'sistema de gestão',
                'sistema de gestao',
                'gestão pública',
                'gestao publica',
                'ambiente web',
                'google workspace',
                'servidor de nuvem',
                'em nuvem',
            ],
        ],
        'protocolo' => [
            'label' => 'Protocolo',
            'keywords' => [
                'protocolo',
                'protocolos administrativos',
                'tramitação digital',
                'tramitacao digital',
                'gestão de processos',
                'gestao de processos',
                'gestão documental',
                'gestao documental',
                'indexação informatizada',
                'indexacao informatizada',
                'automação de processos',
                'automacao de processos',
            ],
        ],
        'gestao_educacional' => [
            'label' => 'Gestão educacional',
            'keywords' => [
                'gestão educacional',
                'gestao educacional',
                'software educacional',
                'rede municipal de ensino',
                'demandas acadêmicas',
                'demandas academicas',
                'pedagógic',
                'pedagogic',
                'secretaria municipal de educação',
                'secretaria municipal de educacao',
                'ensino municipal',
            ],
        ],
        'cesta_de_preco' => [
            'label' => 'Cesta de preço',
            'keywords' => [
                'cesta de preço',
                'cesta de preco',
                'cesta de preços',
                'cesta de precos',
                'pesquisa de preços',
                'pesquisa de precos',
                'banco de preços',
                'banco de precos',
                'mapa de preços',
                'mapa de precos',
            ],
        ],
    ],

    'default_segmentos' => [
        'software',
        'protocolo',
        'gestao_educacional',
        'cesta_de_preco',
    ],

    /*
    |--------------------------------------------------------------------------
    | Objetos excluídos da importação
    |--------------------------------------------------------------------------
    |
    | Se o objeto da oportunidade contiver qualquer um destes termos,
    | a oportunidade é descartada mesmo que case com algum segmento.
    |
    */
    'excluir_keywords' => [
        'registro de preço',
        'registro de preco',
        'registro de preços',
        'registro de precos',
        'ata de registro de preço',
        'ata de registro de preco',
        'ata de registro de preços',
        'ata de registro de precos',
        'sistema de registro de preços',
        'sistema de registro de precos',
        'formação de ata de registro',
        'formacao de ata de registro',
        'aquisição de material',
        'aquisicao de material',
        'aquisição de materiais',
        'aquisicao de materiais',
        'aquisição de material de consumo',
        'aquisicao de material de consumo',
        'aquisição de material permanente',
        'aquisicao de material permanente',
        'compra de material',
        'compra de materiais',
        'fornecimento de material de consumo',
        'fornecimento de materiais de consumo',
    ],

    /*
    |--------------------------------------------------------------------------
    | Planilha de oportunidades (PNCP / Excel)
    |--------------------------------------------------------------------------
    |
    | Importa apenas linhas cuja Data Encerramento Proposta (sem hora)
    | seja igual a hoje + N dias.
    |
    */
    'oportunidades_encerramento_offset_days' => 2,

    'http_timeout' => 60,
    'http_user_agent' => 'Mozilla/5.0 (compatible; 55LAB-EditalBot/1.0)',
];
