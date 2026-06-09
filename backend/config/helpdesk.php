<?php

return [
    'external_api_key' => env('EXTERNAL_HELPDESK_API_KEY'),

    'webhook_url' => env('EXTERNAL_HELPDESK_WEBHOOK_URL'), // fallback opcional; preferir cadastro por sistema no painel

    'webhook_timeout' => (int) env('EXTERNAL_HELPDESK_WEBHOOK_TIMEOUT', 15),

    'webhook_retries' => (int) env('EXTERNAL_HELPDESK_WEBHOOK_RETRIES', 3),

    'attachment_max_bytes' => (int) env('EXTERNAL_HELPDESK_ATTACHMENT_MAX_BYTES', 10 * 1024 * 1024),

    'attachment_allowed_mimes' => [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/zip',
    ],

    'statuses' => [
        'received',
        'triage',
        'in_progress',
        'waiting_external',
        'resolved',
        'closed',
        'cancelled',
    ],

    'types' => [
        'ajuda',
        'duvida',
        'bug',
        'melhoria',
        'correcao',
    ],

    'priorities' => [
        'baixa',
        'media',
        'alta',
        'critica',
    ],

    'status_messages' => [
        'received' => 'Seu chamado foi recebido.',
        'triage' => 'Seu chamado está em triagem.',
        'in_progress' => 'Seu chamado está em atendimento.',
        'waiting_external' => 'Aguardando retorno externo.',
        'resolved' => 'Seu chamado foi resolvido.',
        'closed' => 'Seu chamado foi fechado.',
        'cancelled' => 'Seu chamado foi cancelado.',
    ],
];
