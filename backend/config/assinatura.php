<?php

return [
  /*
  |--------------------------------------------------------------------------
  | URL pública do frontend (para links de verificação e QR Code)
  |--------------------------------------------------------------------------
  */
  'frontend_url' => env('ASSINATURA_FRONTEND_URL', env('APP_URL', 'http://localhost')),

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
