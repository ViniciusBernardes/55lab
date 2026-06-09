<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    public function up(): void
    {
        User::query()->updateOrCreate(
            ['email' => 'admin@55lab.com.br'],
            [
                'name' => 'Administrador',
                'password' => Hash::make('123456'),
                'email_verified_at' => now(),
            ]
        );
    }

    public function down(): void
    {
        User::query()->where('email', 'admin@55lab.com.br')->delete();
    }
};
