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
        Schema::create('transactions', function (Blueprint $table) {
            $table->id('transaction_id');

            $table->unsignedBigInteger('buyer_id');
            $table->foreign('buyer_id')->references('user_id')->on('utilisateurs')->onDelete('cascade');

            $table->unsignedBigInteger('seller_id');
            $table->foreign('seller_id')->references('user_id')->on('utilisateurs')->onDelete('cascade');

            $table->unsignedBigInteger('listing_id');
            $table->foreign('listing_id')->references('listing_id')->on('listings')->onDelete('cascade');

            $table->float('amount_from');
            $table->float('amount_to');
            $table->float('exchange_rate');
            $table->float('buyer_fee')->default(0);
            $table->float('seller_fee')->default(0);
            $table->enum('status', ['PENDING', 'COMPLETED', 'CANCELLED'])->default('PENDING');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
