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
        Schema::create('method_payments', function (Blueprint $table) {
            $table->id('method_payment_id');

            $table->string('type');
            $table->string('provider');
            $table->string('account_number');
            $table->string('bank_code')->nullable();
            $table->boolean('is_default')->default(false);
            $table->boolean('is_verified')->default(false);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('method_payments');
    }
};
