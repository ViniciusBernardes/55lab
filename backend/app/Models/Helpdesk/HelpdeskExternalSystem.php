<?php

namespace App\Models\Helpdesk;

use Illuminate\Database\Eloquent\Model;

class HelpdeskExternalSystem extends Model
{
    protected $fillable = [
        'code',
        'name',
        'webhook_url',
        'description',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }
}
