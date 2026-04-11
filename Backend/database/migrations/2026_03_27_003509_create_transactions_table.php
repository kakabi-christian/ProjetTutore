<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */

    /**
     * Colonnes nécessaires à l'intégration Flutterwave.
     *
     * - flw_tx_ref    : Notre référence unique générée AVANT d'appeler Flutterwave.
     *                   Format : "EXCHA-{transaction_id}-{timestamp}"
     *                   Utile pour retrouver la transaction dans notre webhook.
     *
     * - flw_tx_id     : L'ID de transaction retourné PAR Flutterwave après paiement.
     *                   Utilisé pour la vérification finale via GET /v3/transactions/{id}/verify
     *                   Ref doc: https://developer.flutterwave.com/reference/endpoints/transactions#verify-a-transaction
     *
     * - buyer_payment_method : 'MOBILE_MONEY' | 'CARD' — Le choix de l'acheteur au moment du paiement.
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

            $table->string('flw_tx_ref')->nullable()->unique();

            // ID retourné par Flutterwave après paiement réussi
            $table->string('flw_tx_id')->nullable();

            // Méthode choisie par l'acheteur : MOBILE_MONEY ou CARD
            $table->enum('buyer_payment_method', ['MOBILE_MONEY', 'CARD'])
                ->nullable();

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
