<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('editais', 'destacado')) {
            return;
        }

        Schema::table('editais', function (Blueprint $table) {
            $table->boolean('destacado')->default(false)->after('status');
            $table->index('destacado');
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('editais', 'destacado')) {
            return;
        }

        Schema::table('editais', function (Blueprint $table) {
            $table->dropIndex(['destacado']);
            $table->dropColumn('destacado');
        });
    }
};
