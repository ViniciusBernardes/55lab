<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ia_credenciais', function (Blueprint $table) {
            $table->id();
            $table->string('provider')->default('openai')->unique();
            $table->text('api_key_encrypted')->nullable();
            $table->string('base_url')->default('https://api.openai.com/v1');
            $table->string('model')->default('gpt-4o-mini');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ia_credenciais');
    }
};
