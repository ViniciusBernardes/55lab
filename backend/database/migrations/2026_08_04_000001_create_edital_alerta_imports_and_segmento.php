<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('edital_alerta_imports', function (Blueprint $table) {
            $table->id();
            $table->string('fonte')->nullable();
            $table->string('status')->default('queued');
            $table->string('arquivo_path')->nullable();
            $table->string('arquivo_nome_original')->nullable();
            $table->json('segmentos')->nullable();
            $table->unsignedInteger('total_encontrados')->default(0);
            $table->unsignedInteger('total_filtrados')->default(0);
            $table->unsignedInteger('total_importados')->default(0);
            $table->unsignedInteger('total_erros')->default(0);
            $table->json('resultado')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();

            $table->index('status');
        });

        Schema::table('editais', function (Blueprint $table) {
            $table->foreignId('alerta_import_id')
                ->nullable()
                ->after('id')
                ->constrained('edital_alerta_imports')
                ->nullOnDelete();
            $table->string('segmento')->nullable()->after('modalidade');
            $table->string('fonte')->nullable()->after('segmento');
            $table->text('link_origem')->nullable()->after('fonte');

            $table->index('segmento');
            $table->index('fonte');
        });
    }

    public function down(): void
    {
        Schema::table('editais', function (Blueprint $table) {
            $table->dropConstrainedForeignId('alerta_import_id');
            $table->dropColumn(['segmento', 'fonte', 'link_origem']);
        });

        Schema::dropIfExists('edital_alerta_imports');
    }
};
