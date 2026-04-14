<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Listing;
use App\Models\Payment;
use App\Models\PaymentHistory;
use App\Models\PaymentStatus;
use App\Models\Transaction;
use App\Models\Utilisateur;
use App\Services\FlutterwaveService;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TransactionController extends Controller
{
    protected FlutterwaveService $flwService;

    protected NotificationService $notificationService;

    public function __construct(
        FlutterwaveService $flwService,
        NotificationService $notificationService
    ) {
        $this->flwService = $flwService;
        $this->notificationService = $notificationService;
    }

    // ===========================================================
    // PHASE 1 — Acheteur initie l'échange
    // ===========================================================

    /**
     * POST /api/transactions/initiate
     *
     * Acheteur paie en currency_to (ex: XAF) à la plateforme via Flutterwave.
     * Retourne un payment_link → frontend redirige l'acheteur.
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
        $listing = Listing::with(['utilisateur', 'paymentMethod'])->findOrFail($validated['listing_id']);

        if ($listing->user_id === $buyer->user_id) {
            return response()->json(['message' => 'Vous ne pouvez pas acheter votre propre annonce.'], 422);
        }

        if ((float) $listing->amount_available < (float) $validated['amount_from']) {
            return response()->json([
                'message' => 'Montant demandé supérieur au disponible sur cette annonce.',
                'available' => $listing->amount_available,
            ], 422);
        }

        if ($listing->min_amount > 0 && $validated['amount_from'] < $listing->min_amount) {
            return response()->json([
                'message' => "Le montant minimum est {$listing->min_amount} {$listing->currency_from}.",
            ], 422);
        }

        $exchangeRate = (float) $listing->user_rate;
        $amountFrom = (float) $validated['amount_from'];        // USD
        $amountTo = round($amountFrom * $exchangeRate, 2);    // XAF
        $buyerFee = round($amountTo * 0.01, 2);
        $sellerFee = round($amountFrom * 0.01, 2);
        $totalChargedToBuyer = round($amountTo + $buyerFee, 2);          // XAF total Flutterwave

        try {
            DB::beginTransaction();

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

            $flwTxRef = $transaction->generateFlwTxRef();
            $transaction->update(['flw_tx_ref' => $flwTxRef]);

            $payment = Payment::create([
                'user_id' => $buyer->user_id,
                'transaction_id' => $transaction->transaction_id,
                'method_payment_id' => null,
                'amount' => $totalChargedToBuyer,
                'currency' => $listing->currency_to,
            ]);

            $pendingStatus = PaymentStatus::firstOrCreate(['title' => 'PENDING']);
            PaymentHistory::create([
                'payment_id' => $payment->payment_id,
                'payment_status_id' => $pendingStatus->payment_status_id,
                'date' => now(),
            ]);

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('TransactionController@initiate: Erreur DB', ['msg' => $e->getMessage()]);

            return response()->json(['message' => 'Erreur lors de la création.', 'error' => $e->getMessage()], 500);
        }

        $flwResult = $this->flwService->initializePayment([
            'tx_ref' => $flwTxRef,
            'amount' => $totalChargedToBuyer,
            'currency' => $listing->currency_to,
            'customer_email' => $buyer->email,
            'customer_name' => trim($buyer->firstname.' '.$buyer->lastname),
            'payment_options' => $validated['payment_method'] === 'MOBILE_MONEY' ? 'mobilemoney' : 'card',
            'redirect_url' => config('app.frontend_url').'/payment/callback?tx_ref='.$flwTxRef,
            'description' => "Échange {$amountFrom} {$listing->currency_from} → {$amountTo} {$listing->currency_to}",
            'meta' => [
                'transaction_id' => $transaction->transaction_id,
                'payment_id' => $payment->payment_id,
                'role' => 'buyer',
            ],
        ]);

        if (! $flwResult['success']) {
            $transaction->update(['status' => Transaction::STATUS_CANCELLED]);
            $failedStatus = PaymentStatus::firstOrCreate(['title' => 'FAILED']);
            PaymentHistory::create([
                'payment_id' => $payment->payment_id,
                'payment_status_id' => $failedStatus->payment_status_id,
                'date' => now(),
            ]);

            return response()->json(['message' => "Impossible d'initialiser le paiement.", 'error' => $flwResult['message']], 502);
        }

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

    // ===========================================================
    // PHASE 2 — Vendeur accepte → paie à son tour
    // ===========================================================

    /**
     * POST /api/transactions/{id}/accept
     *
     * Le vendeur accepte la transaction.
     * → Génère un payment_link Flutterwave pour que le vendeur paie
     *   ses currency_from (USD) à la plateforme.
     * → Retourne le payment_link au frontend qui redirige le vendeur.
     *
     * Le webhook EXCHA-S-{id} finalise ensuite la transaction.
     */
    public function accept(int $id)
    {
        /** @var Utilisateur $seller */
        $seller = Auth::user();
        $transaction = Transaction::with(['listing', 'buyer', 'seller'])
            ->findOrFail($id);

        if ($transaction->seller_id !== $seller->user_id) {
            return response()->json(['message' => 'Action non autorisée.'], 403);
        }

        if ($transaction->status !== Transaction::STATUS_AWAITING_SELLER) {
            return response()->json([
                'message' => "Cette transaction ne peut pas être acceptée (statut : {$transaction->status}).",
            ], 422);
        }

        $listing = $transaction->listing;

        // Le vendeur paie amount_from (USD) + ses frais seller à la plateforme
        $sellerFee = (float) $transaction->seller_fee;
        $amountFrom = (float) $transaction->amount_from;
        $totalSellerCharge = round($amountFrom + $sellerFee, 2); // USD total

        // Générer la ref vendeur : préfixe EXCHA-S- pour distinguer dans le webhook
        $flwSellerTxRef = $transaction->generateFlwSellerTxRef();

        // Sauvegarder la ref + passer en AWAITING_SELLER_PAYMENT
        $transaction->update([
            'status' => Transaction::STATUS_AWAITING_SELLER_PAYMENT,
            'flw_seller_tx_ref' => $flwSellerTxRef,
        ]);

        Log::info('TransactionController@accept: Génération du lien vendeur', [
            'transaction_id' => $id,
            'seller_id' => $seller->user_id,
            'total_seller_charge' => $totalSellerCharge,
            'currency' => $listing->currency_from,
            'flw_seller_tx_ref' => $flwSellerTxRef,
        ]);

        // Appel Flutterwave — le vendeur paie en currency_from (USD)
        // Ref: https://developer.flutterwave.com/reference/endpoints/payments#initiate-payment
        $flwResult = $this->flwService->initializePayment([
            'tx_ref' => $flwSellerTxRef,
            'amount' => $totalSellerCharge,
            'currency' => $listing->currency_from,      // USD
            'customer_email' => $seller->email,
            'customer_name' => trim($seller->firstname.' '.$seller->lastname),
            'payment_options' => 'mobilemoney,card',           // vendeur choisit sur la page Flutterwave

            // Flutterwave redirige le vendeur ici après paiement
            'redirect_url' => config('app.frontend_url')
                .'/payment/seller-callback?tx_ref='.$flwSellerTxRef,

            'description' => "Envoi de {$amountFrom} {$listing->currency_from} "
                ."pour l'échange #{$transaction->transaction_id}",

            'meta' => [
                'transaction_id' => $transaction->transaction_id,
                'role' => 'seller', // utilisé dans le webhook pour distinguer
            ],
        ]);

        if (! $flwResult['success']) {
            // Rollback : remettre en AWAITING_SELLER si Flutterwave échoue
            $transaction->update([
                'status' => Transaction::STATUS_AWAITING_SELLER,
                'flw_seller_tx_ref' => null,
            ]);

            Log::error('TransactionController@accept: Flutterwave échoué', [
                'transaction_id' => $id,
                'error' => $flwResult['message'],
            ]);

            return response()->json([
                'message' => 'Impossible de générer le lien de paiement. Veuillez réessayer.',
                'error' => $flwResult['message'],
            ], 502);
        }

        // Notifier l'acheteur que le vendeur a accepté et va payer
        $this->notificationService->notifyBuyerAccepted($transaction);

        return response()->json([
            'message' => 'Vous avez accepté la transaction. Veuillez procéder au paiement.',
            'payment_link' => $flwResult['payment_link'],
            'summary' => [
                'amount_to_send' => $amountFrom,
                'seller_fee' => $sellerFee,
                'total_charged' => $totalSellerCharge,
                'currency' => $listing->currency_from,
            ],
        ]);
    }

    // ===========================================================
    // ANNULATION — Vendeur refuse
    // ===========================================================

    /**
     * POST /api/transactions/{id}/cancel
     *
     * Le vendeur annule → remboursement automatique de l'acheteur via Flutterwave.
     * Ref: https://developer.flutterwave.com/reference/endpoints/transactions#initiate-a-refund
     */
    public function cancel(int $id)
    {
        /** @var Utilisateur $seller */
        $seller = Auth::user();
        $transaction = Transaction::with(['listing', 'buyer', 'seller'])
            ->findOrFail($id);

        if ($transaction->seller_id !== $seller->user_id) {
            return response()->json(['message' => 'Action non autorisée.'], 403);
        }

        if ($transaction->status !== Transaction::STATUS_AWAITING_SELLER) {
            return response()->json([
                'message' => "Cette transaction ne peut pas être annulée (statut : {$transaction->status}).",
            ], 422);
        }

        if (! $transaction->flw_tx_id) {
            Log::error('TransactionController@cancel: flw_tx_id manquant', ['transaction_id' => $id]);

            return response()->json(['message' => 'Référence Flutterwave introuvable.'], 500);
        }

        // Remboursement Flutterwave
        // Ref: https://developer.flutterwave.com/reference/endpoints/transactions#initiate-a-refund
        $refundResult = $this->flwService->refundTransaction($transaction->flw_tx_id);

        $transaction->update(['status' => Transaction::STATUS_CANCELLED]);
        $this->notificationService->notifyBuyerCancelled($transaction);

        if (! $refundResult['success']) {
            Log::error('TransactionController@cancel: Remboursement échoué', [
                'transaction_id' => $id, 'error' => $refundResult['message'],
            ]);

            return response()->json([
                'message' => 'Transaction annulée mais remboursement automatique échoué. Le support a été notifié.',
                'refund_error' => $refundResult['message'],
            ], 207);
        }

        Log::info('TransactionController@cancel: Annulée + remboursement initié', [
            'transaction_id' => $id, 'seller_id' => $seller->user_id,
        ]);

        return response()->json([
            'message' => "Transaction annulée. L'acheteur sera remboursé sous 3 à 5 jours ouvrés.",
            'status' => Transaction::STATUS_CANCELLED,
        ]);
    }

    // ===========================================================
    // UTILITAIRES
    // ===========================================================

    /**
     * GET /api/transactions/status?tx_ref=XXXX
     * Vérifie le statut d'une transaction par sa référence (acheteur ou vendeur).
     */
    public function status(Request $request)
    {
        $txRef = $request->query('tx_ref');
        if (! $txRef) {
            return response()->json(['message' => 'La référence (tx_ref) est requise'], 400);
        }

        // Cherche dans les deux refs (acheteur et vendeur)
        $tx = Transaction::where(function ($q) use ($txRef) {
            $q->where('flw_tx_ref', $txRef)
                ->orWhere('flw_seller_tx_ref', $txRef);
        })
            ->where(function ($q) {
                $userId = Auth::id();
                $q->where('buyer_id', $userId)->orWhere('seller_id', $userId);
            })
            ->first();

        if (! $tx) {
            return response()->json(['message' => 'Transaction introuvable'], 404);
        }

        return response()->json([
            'status' => $tx->status,
            'transaction_id' => $tx->transaction_id,
            'flw_tx_ref' => $tx->flw_tx_ref,
        ]);
    }

    /**
     * GET /api/transactions/my
     * Transactions de l'utilisateur (acheteur OU vendeur).
     */
    public function myTransactions()
    {
        /** @var Utilisateur $user */
        $user = Auth::user();

        $transactions = Transaction::where('buyer_id', $user->user_id)
            ->orWhere('seller_id', $user->user_id)
            ->with([
                'listing:listing_id,currency_from,currency_to',
                'buyer:user_id,firstname,lastname',
                'seller:user_id,firstname,lastname',
            ])
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json($transactions);
    }
}
