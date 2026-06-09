<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->string('attachment_path')->nullable()->after('payload_original');
            $table->string('attachment_filename')->nullable()->after('attachment_path');
            $table->string('attachment_mime')->nullable()->after('attachment_filename');
            $table->unsignedBigInteger('attachment_size')->nullable()->after('attachment_mime');
        });
    }

    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropColumn([
                'attachment_path',
                'attachment_filename',
                'attachment_mime',
                'attachment_size',
            ]);
        });
    }
};
