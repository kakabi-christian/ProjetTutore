<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('kycs', function (Blueprint $table) {
            // On ajoute le champ après 'status' et on le met en nullable
            $table->text('rejection_reason')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('kycs', function (Blueprint $table) { 
            $table->dropColumn('rejection_reason');
        });
    }
};
