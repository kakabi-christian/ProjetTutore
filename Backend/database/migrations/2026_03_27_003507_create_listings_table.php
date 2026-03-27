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
        Schema::create('listings', function (Blueprint $table) {
            $table->id('listing_id');

            $table->unsignedBigInteger('user_id');
            $table->foreign('user_id')->references('user_id')->on('utilisateurs')->onDelete('cascade');

            $table->string('currency_from');
            $table->string('currency_to');
            $table->float('amount_available');
            $table->float('exchange_rate');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('listings');
    }
};
