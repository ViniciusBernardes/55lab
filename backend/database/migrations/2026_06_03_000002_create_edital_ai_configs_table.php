<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('edital_ai_configs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('edital_id')->unique()->constrained('editais')->cascadeOnDelete();
            $table->boolean('enabled')->default(true);
            $table->string('provider')->default('mock');
            $table->string('model')->nullable();
            $table->text('system_prompt')->nullable();
            $table->json('extraction_schema')->nullable();
            $table->boolean('require_review')->default(true);
            $table->boolean('auto_analyze_on_upload')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('edital_ai_configs');
    }
};
