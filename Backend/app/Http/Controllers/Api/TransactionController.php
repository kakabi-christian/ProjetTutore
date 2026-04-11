<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Escrow;
use App\Models\Listing;
use App\Models\Payment;
use App\Models\PaymentHistory;
use App\Models\PaymentStatus;
use App\Models\Transaction;
use App\Models\Utilisateur;
use App\Services\FlutterwaveService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * TransactionController
 *
 * Flow :
 *   1. POST /api/transactions/initiate
 *      → Crée Transaction + Payment + PaymentHistory(PENDING) + Escrow
 *      → Appelle Flutterwave → retourne payment_link
 *   2. User paie sur la page Flutterwave
 *   3. Webhook → WebhookController finalise tout
 *
 * Ref Flutterwave: https://developer.flutterwave.com/reference/endpoints/payments
 */
class TransactionController extends Controller
{
    protected FlutterwaveService $flwService;

    public function __construct(FlutterwaveService $flwService)
    {
        $this->flwService = $flwService;
    }

    /**
     * Initie un échange.
     *
     * Body attendu :
     * {
     *   "listing_id"     : 12,
     *   "amount_from"    : 5000,           // Montant que l'acheteur veut payer (currency_from de l'annonce)
     *   "payment_method" : "MOBILE_MONEY"  // ou "CARD"
     * }
     */
    public function initiate(Request $request)
    {
        $validated = $request->validate([
            'listing_id' => 'required|integer|exists:listings,listing_id',
            'amount_from' => 'required|numeric|min:0.01',
            'payment_method' => 'required|in:MOBILE_MONEY,CARD',
        ]);

        /** @var Utilisateur $buyer */
        $buyer = Auth::user();

        // --- 1. Charger l'annonce ---
        $listing = Listing::with(['utilisateur', 'paymentMethod'])
            ->findOrFail($validated['listing_id']);

        // --- 2. Validations métier ---

        if ($listing->user_id === $buyer->user_id) {
            return response()->json([
                'message' => 'Vous ne pouvez pas acheter votre propre annonce.',
            ], 422);
        }

        if ((float) $listing->amount_available < (float) $validated['amount_from']) {
            return response()->json([
                'message' => 'Montant demandé supérieur au disponible sur cette annonce.',
                'available' => $listing->amount_available,
            ], 422);
        }

        if ($listing->min_amount > 0 && $validated['amount_from'] < $listing->min_amount) {
            return response()->json([
                'message' => "Le montant minimum pour cette annonce est {$listing->min_amount} {$listing->currency_from}.",
            ], 422);
        }

        // --- 3. Calculs financiers ---
        // Logique : le vendeur a currency_from (ex: USD), veut currency_to (ex: XAF)
        // L'acheteur PAIE en currency_to (XAF) pour RECEVOIR currency_from (USD)

        $exchangeRate = (float) $listing->user_rate;  // 1 USD = 600.5 XAF
        $amountFrom = (float) $validated['amount_from']; // USD que l'acheteur veut recevoir

        // XAF que l'acheteur doit verser
        $amountTo = round($amountFrom * $exchangeRate, 2); // 500 * 600.5 = 300 250 XAF

        // Frais plateforme calculés sur ce que chaque partie verse
        $buyerFee = round($amountTo * 0.01, 2);     // 1% sur XAF versé par l'acheteur
        $sellerFee = round($amountFrom * 0.01, 2);   // 1% sur USD reçu par le vendeur

        // Total réellement débité à l'acheteur via Flutterwave (en XAF)
        $totalChargedToBuyer = round($amountTo + $buyerFee, 2); // 300 250 + 3002.5 = 303 252.5 XAF

        Log::info('TransactionController@initiate: Calculs', [
            'buyer_id' => $buyer->user_id,
            'listing_id' => $listing->listing_id,
            'amount_from' => $amountFrom,
            'amount_to' => $amountTo,
            'buyer_fee' => $buyerFee,
            'total_charged_to_buyer' => $totalChargedToBuyer,
        ]);

        // --- 4. Création atomique en base de données ---
        try {
            DB::beginTransaction();

            // 4a. Créer la Transaction
            $transaction = Transaction::create([
                'buyer_id' => $buyer->user_id,
                'seller_id' => $listing->user_id,
                'listing_id' => $listing->listing_id,
                'amount_from' => $amountFrom,
                'amount_to' => $amountTo,
                'exchange_rate' => $exchangeRate,
                'buyer_fee' => $buyerFee,
                'seller_fee' => $sellerFee,
                'buyer_payment_method' => $validated['payment_method'],
            ]);

            // 4b. Générer et sauvegarder la référence Flutterwave
            $flwTxRef = $transaction->generateFlwTxRef();
            $transaction->update(['flw_tx_ref' => $flwTxRef]);

            // 4c. Créer le Payment (sans champ status — géré via PaymentHistory)
            $payment = Payment::create([
                'user_id' => $buyer->user_id,
                'transaction_id' => $transaction->transaction_id,
                'method_payment_id' => null, // Flutterwave gère le choix final
                'amount' => $totalChargedToBuyer,
                'currency' => $listing->currency_to,
            ]);

            // 4d. Créer le premier PaymentHistory → statut PENDING
            $pendingStatus = PaymentStatus::firstOrCreate(['title' => 'PENDING']);
            PaymentHistory::create([
                'payment_id' => $payment->payment_id,
                'payment_status_id' => $pendingStatus->payment_status_id,
                'date' => now(),
            ]);

            // 4e. Créer l'Escrow
            Escrow::create([
                'transaction_id' => $transaction->transaction_id,
                'buyer_amount' => $totalChargedToBuyer,
                'seller_amount' => $amountTo,
                'locked_at' => now(),
                'released_at' => null,
            ]);

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('TransactionController@initiate: Erreur DB', [
                'msg' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Erreur lors de la création de la transaction.',
                'error' => $e->getMessage(),
            ], 500);
        }

        // --- 5. Appel Flutterwave ---
        // Ref: https://developer.flutterwave.com/reference/endpoints/payments#initiate-payment
        $flwPaymentOption = $validated['payment_method'] === 'MOBILE_MONEY'
            ? 'mobilemoney'
            : 'card';

        $flwResult = $this->flwService->initializePayment([
            'tx_ref' => $flwTxRef,
            'amount' => $totalChargedToBuyer,
            'currency' => $listing->currency_to,
            'customer_email' => $buyer->email,
            'customer_name' => trim($buyer->firstname.' '.$buyer->lastname),
            'payment_options' => $flwPaymentOption,

            // Flutterwave redirigera l'user ici après paiement
            // Ref: https://developer.flutterwave.com/docs/collecting-payments/standard#redirect-parameters
            'redirect_url' => config('app.frontend_url').'/payment/callback?tx_ref='.$flwTxRef,

            'description' => "Échange {$amountFrom} {$listing->currency_from} → {$amountTo} {$listing->currency_to}",

            'meta' => [
                'transaction_id' => $transaction->transaction_id,
                'listing_id' => $listing->listing_id,
                'payment_id' => $payment->payment_id,
            ],
        ]);

        // --- 6. Si Flutterwave échoue, on annule ---
        if (! $flwResult['success']) {
            $transaction->update(['status' => Transaction::STATUS_CANCELLED]);

            $failedStatus = PaymentStatus::firstOrCreate(['title' => 'FAILED']);
            PaymentHistory::create([
                'payment_id' => $payment->payment_id,
                'payment_status_id' => $failedStatus->payment_status_id,
                'date' => now(),
            ]);

            Log::error('TransactionController@initiate: Flutterwave a échoué', [
                'transaction_id' => $transaction->transaction_id,
                'flw_message' => $flwResult['message'],
            ]);

            return response()->json([
                'message' => 'Impossible d\'initialiser le paiement. Veuillez réessayer.',
                'error' => $flwResult['message'],
            ], 502);
        }

        // --- 7. Retour au frontend ---
        return response()->json([
            'message' => 'Transaction initiée avec succès',
            'payment_link' => $flwResult['payment_link'],
            'transaction_id' => $transaction->transaction_id,
            'flw_tx_ref' => $flwTxRef,
            'summary' => [
                'amount_from' => $amountFrom,
                'currency_from' => $listing->currency_from,
                'amount_to' => $amountTo,
                'currency_to' => $listing->currency_to,
                'buyer_fee' => $buyerFee,
                'total_to_pay' => $totalChargedToBuyer,
                'exchange_rate' => $exchangeRate,
            ],
        ], 201);
    }
}
