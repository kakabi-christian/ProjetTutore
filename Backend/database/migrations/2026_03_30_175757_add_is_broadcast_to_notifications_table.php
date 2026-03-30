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
        Schema::table('notifications', function (Blueprint $table) {
            // On ajoute le champ et on rend user_id nullable si besoin
            $table->boolean('is_broadcast')->default(false)->after('user_id');
            $table->unsignedBigInteger('user_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropColumn('is_broadcast');
            $table->unsignedBigInteger('user_id')->nullable(false)->change();
        });
    }
};
