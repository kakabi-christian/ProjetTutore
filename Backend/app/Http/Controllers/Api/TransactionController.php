<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Listing;
use App\Models\MethodPayment;
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
     * L'acheteur choisit son compte de réception (buyer_method_payment_id)
     * en plus de sa méthode de paiement.
     */
  public function initiate(Request $request)
{
    Log::info('--- Début de l\'initialisation d\'une transaction ---', [
        'ip' => $request->ip(),
        'payload' => $request->all()
    ]);

    $validated = $request->validate([
        'listing_id'               => 'required|integer|exists:listings,listing_id',
        'amount_from'              => 'required|numeric|min:0.01',
        'payment_method'           => 'required|in:MOBILE_MONEY,CARD',
        // Le compte sur lequel l'acheteur veut recevoir ses fonds (currency_from)
        'buyer_method_payment_id'  => 'required|integer|exists:method_payments,method_payment_id',
    ]);

    /** @var Utilisateur $buyer */
    $buyer = Auth::user();
    Log::info('Acheteur authentifié', ['user_id' => $buyer->user_id, 'email' => $buyer->email]);

    $listing = Listing::with(['utilisateur', 'paymentMethod'])->findOrFail($validated['listing_id']);
    Log::info('Annonce récupérée pour la transaction', [
        'listing_id' => $listing->listing_id,
        'seller_id' => $listing->user_id,
        'amount_available' => $listing->amount_available,
        'currency_from' => $listing->currency_from
    ]);

    // Vérifier que ce compte appartient bien à l'acheteur
    $buyerMethod = MethodPayment::where('method_payment_id', $validated['buyer_method_payment_id'])
        ->where('user_id', $buyer->user_id)
        ->first();

    if (!$buyerMethod) {
        // CORRIGÉ : Double guillemet extérieur pour utiliser l'apostrophe librement
        Log::warning("Échec d'initialisation : Le compte de réception n'appartient pas à l'acheteur", [
            'buyer_id' => $buyer->user_id,
            'requested_method_id' => $validated['buyer_method_payment_id']
        ]);
        return response()->json(['message' => 'Ce compte de réception ne vous appartient pas.'], 403);
    }

    if ($listing->user_id === $buyer->user_id) {
        Log::warning("Échec d'initialisation : Tentative d'achat de sa propre annonce", [
            'user_id' => $buyer->user_id,
            'listing_id' => $listing->listing_id
        ]);
        return response()->json(['message' => 'Vous ne pouvez pas acheter votre propre annonce.'], 422);
    }

    if ((float) $listing->amount_available < (float) $validated['amount_from']) {
        Log::warning("Échec d'initialisation : Solde de l'annonce insuffisant", [
            'listing_id' => $listing->listing_id,
            'available' => $listing->amount_available,
            'requested' => $validated['amount_from']
        ]);
        return response()->json([
            'message' => 'Montant demandé supérieur au disponible sur cette annonce.',
            'available' => $listing->amount_available,
        ], 422);
    }

    if ($listing->min_amount > 0 && $validated['amount_from'] < $listing->min_amount) {
        Log::warning("Échec d'initialisation : Montant inférieur au minimum requis par l'annonce", [
            'listing_id' => $listing->listing_id,
            'min_required' => $listing->min_amount,
            'requested' => $validated['amount_from']
        ]);
        return response()->json([
            'message' => "Le montant minimum est {$listing->min_amount} {$listing->currency_from}.",
        ], 422);
    }

    // Calculs financiers
    $exchangeRate = (float) $listing->user_rate;
    $amountFrom = (float) $validated['amount_from'];        // ex: USD
    $amountTo = round($amountFrom * $exchangeRate, 2);    // ex: XAF
    $buyerFee = round($amountTo * 0.01, 2);
    $sellerFee = round($amountFrom * 0.01, 2);
    $totalChargedToBuyer = round($amountTo + $buyerFee, 2); // XAF total Flutterwave

    Log::info('Calculs financiers terminés', [
        'exchange_rate' => $exchangeRate,
        'amount_from' => $amountFrom,
        'amount_to' => $amountTo,
        'buyer_fee' => $buyerFee,
        'seller_fee' => $sellerFee,
        'total_charged_to_buyer' => $totalChargedToBuyer
    ]);

    try {
        Log::info('Ouverture de la transaction DB globale');
        DB::beginTransaction();

        $transaction = Transaction::create([
            'buyer_id'                => $buyer->user_id,
            'seller_id'               => $listing->user_id,
            'listing_id'              => $listing->listing_id,
            'amount_from'             => $amountFrom,
            'amount_to'               => $amountTo,
            'exchange_rate'           => $exchangeRate,
            'buyer_fee'               => $buyerFee,
            'seller_fee'              => $sellerFee,
            'buyer_payment_method'    => $validated['payment_method'],
            'buyer_method_payment_id' => $validated['buyer_method_payment_id'],
        ]);

        $flwTxRef = $transaction->generateFlwTxRef();
        $transaction->update(['flw_tx_ref' => $flwTxRef]);
        
        Log::info('Enregistrement Transaction DB créé', [
            'transaction_id' => $transaction->transaction_id,
            'flw_tx_ref' => $flwTxRef
        ]);

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

        try {
            DB::beginTransaction();

            $transaction = Transaction::create([
                'buyer_id'                => $buyer->user_id,
                'seller_id'               => $listing->user_id,
                'listing_id'              => $listing->listing_id,
                'amount_from'             => $amountFrom,
                'amount_to'               => $amountTo,
                'exchange_rate'           => $exchangeRate,
                'buyer_fee'               => $buyerFee,
                'seller_fee'              => $sellerFee,
                'buyer_payment_method'    => $validated['payment_method'],
                'buyer_method_payment_id' => $validated['buyer_method_payment_id'], // ← Phase 3
                'status'                  => Transaction::STATUS_AWAITING_SELLER, // ✅ Enregistre directement AWAITING_SELLER au lieu de PENDING
            ]);

        return response()->json(['message' => 'Erreur lors de la création.', 'error' => $e->getMessage()], 500);
    }

    // Préparation de l'appel au service Flutterwave
    $flwPayload = [
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
    ];

    Log::info('Envoi de la requête d\'initialisation à Flutterwave', ['flw_payload' => $flwPayload]);

    $flwResult = $this->flwService->initializePayment($flwPayload);

    Log::info('Réponse reçue de Flutterwave', ['flw_result' => $flwResult]);

    if (! $flwResult['success']) {
        Log::error('Échec de l\'initialisation du paiement chez Flutterwave', [
            'flw_tx_ref' => $flwTxRef,
            'transaction_id' => $transaction->transaction_id,
            'flw_message' => $flwResult['message'] ?? 'Aucun message retourné'
        ]);

        try {
            $transaction->update(['status' => Transaction::STATUS_CANCELLED]);
            $failedStatus = PaymentStatus::firstOrCreate(['title' => 'FAILED']);
            PaymentHistory::create([
                'payment_id' => $payment->payment_id,
                'payment_status_id' => $failedStatus->payment_status_id,
                'date' => now(),
            ]);
            Log::info('Statuts mis à jour à CANCELLED / FAILED suite à l\'échec Flutterwave');
        } catch (\Exception $updateEx) {
            Log::error('Erreur lors de la mise à jour des statuts suite à l\'échec Flutterwave', [
                'error' => $updateEx->getMessage()
            ]);
        }

        // Charger les relations nécessaires pour les notifications
        $transaction->load(['listing', 'buyer', 'seller']);
        $this->notificationService->notifyBuyer($transaction);
        $this->notificationService->notifySeller($transaction);

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

    Log::info('--- Fin de l\'initialisation réussie ---', [
        'transaction_id' => $transaction->transaction_id,
        'flw_tx_ref' => $flwTxRef,
        'payment_link' => $flwResult['payment_link'] ?? 'Lien absent'
    ]);

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
    // PHASE 2 — Vendeur accepte
    // ===========================================================

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
            return response()->json(['message' => "Statut invalide : {$transaction->status}."], 422);
        }

        $listing           = $transaction->listing;
        $sellerFee         = (float) $transaction->seller_fee;
        $amountFrom        = (float) $transaction->amount_from;
        $totalSellerCharge = round($amountFrom + $sellerFee, 2);
        $flwSellerTxRef    = $transaction->generateFlwSellerTxRef();

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
    // ANNULATION
    // ===========================================================

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
            return response()->json(['message' => "Statut invalide : {$transaction->status}."], 422);
        }

        if (! $transaction->flw_tx_id) {
            Log::error('TransactionController@cancel: flw_tx_id manquant', ['transaction_id' => $id]);

            return response()->json(['message' => 'Référence Flutterwave introuvable.'], 500);
        }

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

        return response()->json(['message' => "Annulée. Remboursement sous 3–5 jours.", 'status' => Transaction::STATUS_CANCELLED]);
    }

    // ===========================================================
    // PHASE 3 — Libération des fonds (appelé par WebhookController)
    // ===========================================================

    /**
     * Déclenche les deux transferts après confirmation du paiement vendeur :
     *
     *   Transfer 1 → Acheteur reçoit currency_from (ex: USD) sur son buyerMethodPayment
     *   Transfer 2 → Vendeur reçoit currency_to (ex: XAF) sur son listing->paymentMethod
     *
     * Les frais sont déduits :
     *   - Acheteur reçoit : amount_from (sans les frais — il les a déjà payés en phase 1)
     *   - Vendeur reçoit  : amount_to - seller_fee (ses frais)
     *
     * En cas d'échec d'un transfer → log critique + notif support.
     * On ne rollback pas la transaction COMPLETED : les fonds sont déjà reçus.
     */
    // public function disburseFunds(Transaction $transaction): void
    // {
    //     $listing = $transaction->listing;

    //     // --- Transfer 1 : Acheteur ← currency_from (ex: USD) ---
    //     $buyerMethod = $transaction->buyerMethodPayment;

    //     if (!$buyerMethod) {
    //         Log::critical('TransactionController@disburseFunds: buyerMethodPayment manquant', [
    //             'transaction_id' => $transaction->transaction_id,
    //         ]);
    //         $this->notificationService->notifyTransferFailed(
    //             $transaction->buyer_id,
    //             (float) $transaction->amount_from,
    //             $listing->currency_from,
    //             $transaction->transaction_id
    //         );
    //     } else {
    //         $buyerTransferResult = $this->flwService->createTransfer([
    //             // Ref: https://developer.flutterwave.com/reference/endpoints/transfers#create-a-transfer
    //             'account_bank'     => $buyerMethod->bank_code ?? $buyerMethod->provider,
    //             'account_number'   => $buyerMethod->account_number,
    //             'amount'           => (float) $transaction->amount_from,      // USD
    //             'currency'         => $listing->currency_from,                // USD
    //             'narration'        => "ExchaPay — Échange #{$transaction->transaction_id}",
    //             'reference'        => 'EXCHA-BUYER-' . $transaction->transaction_id . '-' . time(),
    //             'beneficiary_name' => $buyerMethod->account_name,
    //         ]);

    //         if ($buyerTransferResult['success']) {
    //             $accountInfo = strtoupper($buyerMethod->provider) . ' — ' . $buyerMethod->account_number;
    //             $this->notificationService->notifyTransferSuccess(
    //                 $transaction->buyer_id,
    //                 (float) $transaction->amount_from,
    //                 $listing->currency_from,
    //                 $accountInfo
    //             );
    //             Log::info('TransactionController@disburseFunds: Transfer acheteur OK', [
    //                 'transaction_id' => $transaction->transaction_id,
    //                 'buyer_id'       => $transaction->buyer_id,
    //                 'amount'         => $transaction->amount_from,
    //                 'currency'       => $listing->currency_from,
    //             ]);
    //         } else {
    //             Log::critical('TransactionController@disburseFunds: Transfer acheteur ÉCHOUÉ', [
    //                 'transaction_id' => $transaction->transaction_id,
    //                 'error'          => $buyerTransferResult['message'],
    //             ]);
    //             $this->notificationService->notifyTransferFailed(
    //                 $transaction->buyer_id,
    //                 (float) $transaction->amount_from,
    //                 $listing->currency_from,
    //                 $transaction->transaction_id
    //             );
    //         }
    //     }

    //     // --- Transfer 2 : Vendeur ← currency_to net de frais (ex: XAF) ---
    //     $sellerMethod = $listing->paymentMethod; // Défini lors de la création de l'annonce

    //     $sellerNetAmount = round((float) $transaction->amount_to - (float) $transaction->seller_fee, 2);

    //     if (!$sellerMethod) {
    //         Log::critical('TransactionController@disburseFunds: sellerMethodPayment manquant', [
    //             'transaction_id' => $transaction->transaction_id,
    //         ]);
    //         $this->notificationService->notifyTransferFailed(
    //             $transaction->seller_id,
    //             $sellerNetAmount,
    //             $listing->currency_to,
    //             $transaction->transaction_id
    //         );
    //     } else {
    //         $sellerTransferResult = $this->flwService->createTransfer([
    //             'account_bank'     => $sellerMethod->bank_code ?? $sellerMethod->provider,
    //             'account_number'   => $sellerMethod->account_number,
    //             'amount'           => $sellerNetAmount,                 // XAF net
    //             'currency'         => $listing->currency_to,            // XAF
    //             'narration'        => "ExchaPay — Échange #{$transaction->transaction_id}",
    //             'reference'        => 'EXCHA-SELLER-' . $transaction->transaction_id . '-' . time(),
    //             'beneficiary_name' => $sellerMethod->account_name,
    //         ]);

    //         if ($sellerTransferResult['success']) {
    //             $accountInfo = strtoupper($sellerMethod->provider) . ' — ' . $sellerMethod->account_number;
    //             $this->notificationService->notifyTransferSuccess(
    //                 $transaction->seller_id,
    //                 $sellerNetAmount,
    //                 $listing->currency_to,
    //                 $accountInfo
    //             );
    //             Log::info('TransactionController@disburseFunds: Transfer vendeur OK', [
    //                 'transaction_id' => $transaction->transaction_id,
    //                 'seller_id'      => $transaction->seller_id,
    //                 'amount'         => $sellerNetAmount,
    //                 'currency'       => $listing->currency_to,
    //             ]);
    //         } else {
    //             Log::critical('TransactionController@disburseFunds: Transfer vendeur ÉCHOUÉ', [
    //                 'transaction_id' => $transaction->transaction_id,
    //                 'error'          => $sellerTransferResult['message'],
    //             ]);
    //             $this->notificationService->notifyTransferFailed(
    //                 $transaction->seller_id,
    //                 $sellerNetAmount,
    //                 $listing->currency_to,
    //                 $transaction->transaction_id
    //             );
    //         }
    //     }
    // }

    // ===========================================================
    // PHASE 3 — Libération des fonds (SIMULATION DEV)
    // Pas d'appel réel Flutterwave Transfer en mode sandbox.
    // On simule un succès instantané et on notifie les deux parties.
    // ===========================================================

    /**
     * Simule la libération des fonds après confirmation du paiement vendeur.
     *
     * Version DEV : bypasse createTransfer() de Flutterwave.
     * Notifie directement acheteur et vendeur comme si le virement était initié.
     *
     * En production → décommenter disburseFunds() ci-dessus et supprimer cette méthode.
     */
    public function disburseFunds(Transaction $transaction): void
    {
        $listing = $transaction->listing;

        // --- Simulation Transfer 1 : Acheteur ← currency_from (ex: USD) ---
        $buyerMethod = $transaction->buyerMethodPayment;

        if (! $buyerMethod) {
            Log::warning('disburseFunds[SIM]: buyerMethodPayment manquant — notif échec acheteur', [
                'transaction_id' => $transaction->transaction_id,
            ]);
            $this->notificationService->notifyTransferFailed(
                $transaction->buyer_id,
                (float) $transaction->amount_from,
                $listing->currency_from,
                $transaction->transaction_id
            );
        } else {
            $accountInfo = strtoupper($buyerMethod->provider ?? 'COMPTE')
                . ' — ' . $buyerMethod->account_number;

            $this->notificationService->notifyTransferSuccess(
                $transaction->buyer_id,
                (float) $transaction->amount_from,
                $listing->currency_from,
                $accountInfo
            );

            Log::info('disburseFunds[SIM]: Acheteur notifié (transfert simulé)', [
                'transaction_id' => $transaction->transaction_id,
                'buyer_id'       => $transaction->buyer_id,
                'amount'         => $transaction->amount_from,
                'currency'       => $listing->currency_from,
            ]);
        }

        // --- Simulation Transfer 2 : Vendeur ← currency_to net de frais (ex: XAF) ---
        $sellerMethod = $listing->paymentMethod;
        $sellerNetAmount = round((float) $transaction->amount_to - (float) $transaction->seller_fee, 2);

        if (! $sellerMethod) {
            Log::warning('disburseFunds[SIM]: sellerMethodPayment manquant — notif échec vendeur', [
                'transaction_id' => $transaction->transaction_id,
            ]);
            $this->notificationService->notifyTransferFailed(
                $transaction->seller_id,
                $sellerNetAmount,
                $listing->currency_to,
                $transaction->transaction_id
            );
        } else {
            $accountInfo = strtoupper($sellerMethod->provider ?? 'COMPTE')
                . ' — ' . $sellerMethod->account_number;

            $this->notificationService->notifyTransferSuccess(
                $transaction->seller_id,
                $sellerNetAmount,
                $listing->currency_to,
                $accountInfo
            );

            Log::info('disburseFunds[SIM]: Vendeur notifié (transfert simulé)', [
                'transaction_id' => $transaction->transaction_id,
                'seller_id'      => $transaction->seller_id,
                'amount'         => $sellerNetAmount,
                'currency'       => $listing->currency_to,
            ]);
        }
    }

    // ===========================================================
    // UTILITAIRES
    // ===========================================================

    public function status(Request $request)
    {
        $txRef = $request->query('tx_ref');
        if (! $txRef) {
            return response()->json(['message' => 'La référence (tx_ref) est requise'], 400);
        }

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
                'buyerMethodPayment:method_payment_id,type,provider,account_number',
            ])
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json($transactions);
    }
}
