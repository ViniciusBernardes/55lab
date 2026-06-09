<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tickets', function (Blueprint $table) {
            $table->id();
            $table->string('external_id');
            $table->string('title');
            $table->text('description');
            $table->string('type');
            $table->string('priority');
            $table->string('status')->default('received');
            $table->string('requester_name');
            $table->string('requester_email');
            $table->string('external_system');
            $table->json('payload_original')->nullable();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();

            $table->unique(['external_system', 'external_id']);
            $table->index('status');
            $table->index('priority');
            $table->index('type');
            $table->index('assigned_to');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tickets');
    }
};
