<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('certificados_digitais', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('apelido');
            $table->string('titular_nome');
            $table->string('titular_cpf_mascarado', 20)->nullable();
            $table->string('emissor_certificado')->nullable();
            $table->date('validade_certificado')->nullable();
            $table->boolean('icp_brasil')->default(true);
            $table->text('arquivo_pfx_encrypted');
            $table->text('senha_encrypted');
            $table->boolean('is_padrao')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['user_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('certificados_digitais');
    }
};
