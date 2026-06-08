<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('edital_analises', function (Blueprint $table) {
            $table->id();
            $table->foreignId('edital_id')->constrained('editais')->cascadeOnDelete();
            $table->string('status')->default('queued');
            $table->string('identified_type')->nullable();
            $table->decimal('confidence', 5, 4)->nullable();
            $table->json('result_snapshot')->nullable();
            $table->json('extracted_fields')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->index(['edital_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('edital_analises');
    }
};
