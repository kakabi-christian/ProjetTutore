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
        Schema::create('ues', function (Blueprint $table) {
           $table->string('code_ue', 20)->primary();
            $table->string('label_ue', 100);
            $table->text('desc_ue', 256)->nullable();
            $table->integer('code_niveau')->unsigned();
            $table->foreign('code_niveau')->references('code_niveau')->on('niveaux')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ues');
    }
};
