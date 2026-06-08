<?php

namespace App\Exceptions;

use RuntimeException;

class PdfSecuredException extends RuntimeException
{
    public function __construct(string $message = 'PDF protegido — será enviado diretamente para análise pela OpenAI.')
    {
        parent::__construct($message);
    }
}
