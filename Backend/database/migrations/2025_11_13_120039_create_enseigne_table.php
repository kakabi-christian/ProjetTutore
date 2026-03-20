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
        Schema::create('enseigne', function (Blueprint $table) {
            // 🔹 ID UUID unique pour chaque ligne
            $table->uuid('id')->primary();

            $table->string('code_pers',50);
            $table->string('code_ec',50);
            $table->date('date_ens');
            $table->timestamps();

            // 🔹 Clés étrangères
            $table->foreign('code_pers')->references('code_pers')->on('personnels')->onDelete('cascade');
            $table->foreign('code_ec')->references('code_ec')->on('ec')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('enseigne');
    }
};
