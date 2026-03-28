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
        Schema::create('listing_histories', function (Blueprint $table) {
            $table->id('listing_history_id');

            $table->unsignedBigInteger('listing_id');
            $table->foreign('listing_id')->references('listing_id')->on('listings')->onDelete('cascade');

            $table->unsignedBigInteger('listing_status_id')->nullable();
            $table->foreign('listing_status_id')->references('listing_status_id')->on('listing_statuses')->onDelete('set null');

            $table->timestamp('date');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('listing_histories');
    }
};
