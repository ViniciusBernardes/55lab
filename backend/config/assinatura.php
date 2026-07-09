<?php

$frontendUrl = env('ASSINATURA_FRONTEND_URL') ?: env('FRONTEND_URL');

if (! $frontendUrl && ($domain = env('DOMAIN'))) {
    $scheme = env('ASSINATURA_FRONTEND_SCHEME')
        ?: (env('APP_ENV') === 'production' ? 'https' : 'http');
    $frontendUrl = "{$scheme}://{$domain}";
}

if (! $frontendUrl) {
    $frontendUrl = 'http://localhost';
}

return [
    /*
    |--------------------------------------------------------------------------
    | URL pública do frontend (links de verificação, QR Code e tarja lateral)
    |--------------------------------------------------------------------------
    */
    'frontend_url' => rtrim((string) $frontendUrl, '/'),

    /*
    |--------------------------------------------------------------------------
    | Papéis disponíveis para signatários
    |--------------------------------------------------------------------------
    */
    'papeis' => [
        'Parte',
        'Testemunha',
        'Contratante',
        'Contratado',
        'Representante Legal',
    ],
];
