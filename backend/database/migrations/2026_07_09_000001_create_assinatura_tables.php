<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('documentos_assinatura', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('titulo');
            $table->string('codigo_verificacao', 19)->unique();
            $table->string('hash_documento', 64);
            $table->string('arquivo_original_path');
            $table->string('arquivo_original_nome');
            $table->unsignedBigInteger('arquivo_original_tamanho');
            $table->string('arquivo_assinado_path')->nullable();
            $table->unsignedBigInteger('arquivo_assinado_tamanho')->nullable();
            $table->string('status')->default('pendente');
            $table->timestamps();

            $table->index('status');
            $table->index('codigo_verificacao');
        });

        Schema::create('assinaturas_documento', function (Blueprint $table) {
            $table->id();
            $table->foreignId('documento_assinatura_id')->constrained('documentos_assinatura')->cascadeOnDelete();
            $table->string('signatario_nome');
            $table->string('signatario_cpf_mascarado', 20);
            $table->string('signatario_papel')->default('Parte');
            $table->timestamp('assinado_em');
            $table->string('cadeia_certificadora');
            $table->string('emissor_certificado');
            $table->string('serial_certificado');
            $table->date('validade_certificado');
            $table->boolean('icp_brasil')->default(true);
            $table->string('assinatura_pkcs7_path')->nullable();
            $table->timestamps();

            $table->index('documento_assinatura_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assinaturas_documento');
        Schema::dropIfExists('documentos_assinatura');
    }
};
