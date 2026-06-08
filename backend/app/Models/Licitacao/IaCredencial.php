<?php

namespace App\Models\Licitacao;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class IaCredencial extends Model
{
    protected $table = 'ia_credenciais';

    protected $fillable = [
        'provider',
        'api_key_encrypted',
        'base_url',
        'model',
        'is_active',
    ];

    protected $hidden = [
        'api_key_encrypted',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function setApiKeyAttribute(?string $value): void
    {
        if ($value === null || $value === '') {
            $this->attributes['api_key_encrypted'] = null;

            return;
        }

        $this->attributes['api_key_encrypted'] = Crypt::encryptString($value);
    }

    public function getApiKey(): ?string
    {
        if (blank($this->api_key_encrypted)) {
            return null;
        }

        try {
            return Crypt::decryptString($this->api_key_encrypted);
        } catch (\Throwable) {
            return null;
        }
    }

    public function maskedApiKey(): ?string
    {
        $key = $this->getApiKey();
        if (! $key) {
            return null;
        }

        if (strlen($key) <= 8) {
            return str_repeat('*', strlen($key));
        }

        return substr($key, 0, 3).'…'.substr($key, -4);
    }
}
