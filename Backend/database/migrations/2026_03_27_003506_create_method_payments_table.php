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

            // Liaison à l'utilisateur
            $table->unsignedBigInteger('user_id');
            $table->foreign('user_id')->references('user_id')->on('utilisateurs')->onDelete('cascade');

            $table->string('type'); // Ex: 'Mobile Money', 'Bank Transfer'
            $table->string('provider'); // Ex: 'MTN', 'Orange', 'UBA'
            $table->string('currency', 3); // Ex: 'XAF', 'NGN', 'USD'

            // Données sensibles chiffrées (donc type text)
            $table->text('account_number'); 
            $table->text('account_name'); 

            $table->string('bank_code')->nullable(); // Code banque ou SWIFT (souvent public, donc pas besoin de chiffrer)
            
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