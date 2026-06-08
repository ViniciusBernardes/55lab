<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('editais', function (Blueprint $table) {
            $table->id();
            $table->string('titulo');
            $table->string('numero')->nullable();
            $table->string('orgao')->nullable();
            $table->string('modalidade')->nullable();
            $table->text('objeto')->nullable();
            $table->decimal('valor_estimado', 15, 2)->nullable();
            $table->date('data_abertura')->nullable();
            $table->date('data_encerramento')->nullable();
            $table->string('status')->default('rascunho');
            $table->string('arquivo_path')->nullable();
            $table->string('arquivo_nome_original')->nullable();
            $table->string('arquivo_mime')->nullable();
            $table->unsignedBigInteger('arquivo_tamanho')->nullable();
            $table->text('observacoes')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('numero');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('editais');
    }
};
