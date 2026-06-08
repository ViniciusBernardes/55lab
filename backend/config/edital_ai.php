<?php

return [
    'enabled' => env('EDITAL_AI_ENABLED', true),

    'default_provider' => env('EDITAL_AI_PROVIDER', 'mock'),

    'default_model' => env('EDITAL_AI_MODEL', 'gpt-4o-mini'),

    'openai' => [
        'api_key' => env('OPENAI_API_KEY'),
        'base_url' => env('OPENAI_BASE_URL', 'https://api.openai.com/v1'),
    ],

    'default_system_prompt' => <<<'PROMPT'
Você é um assistente especializado em análise de editais de licitação pública no Brasil.
Extraia as informações solicitadas com precisão, citando trechos relevantes quando possível.
Se um campo não estiver presente no documento, retorne null para esse campo.
PROMPT,

    'default_extraction_schema' => [
        'fields' => [
            ['key' => 'numero_edital', 'label' => 'Número do edital', 'required' => true],
            ['key' => 'orgao', 'label' => 'Órgão licitante', 'required' => true],
            ['key' => 'modalidade', 'label' => 'Modalidade', 'required' => true],
            ['key' => 'objeto', 'label' => 'Objeto da licitação', 'required' => true],
            ['key' => 'valor_estimado', 'label' => 'Valor estimado', 'required' => false],
            ['key' => 'data_abertura', 'label' => 'Data de abertura', 'required' => false],
            ['key' => 'data_encerramento', 'label' => 'Data de encerramento', 'required' => false],
            ['key' => 'prazo_entrega_propostas', 'label' => 'Prazo para entrega de propostas', 'required' => false],
            ['key' => 'criterio_julgamento', 'label' => 'Critério de julgamento', 'required' => false],
            ['key' => 'contato', 'label' => 'Contato / e-mail / telefone', 'required' => false],
        ],
    ],
];
