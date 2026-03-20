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
        Schema::create('ecs', function (Blueprint $table) {
            $table->string('code_ec', 20)->primary();
            $table->string('label_ec', 100);
            $table->string('desc_ec', 256)->nullable();
            $table->integer('nbh_ec');
            $table->integer('nbc_ec');

            // 🖼️ Image de l'EC (chemin du fichier)
            $table->string('image_ec')->nullable();

            $table->string('code_ue', 20);
            $table->foreign('code_ue')
                  ->references('code_ue')
                  ->on('ue')
                  ->onDelete('cascade');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ecs');
    }
};
