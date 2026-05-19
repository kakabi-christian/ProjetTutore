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
        $this->flwService          = $flwService;
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
        $validated = $request->validate([
            'listing_id'               => 'required|integer|exists:listings,listing_id',
            'amount_from'              => 'required|numeric|min:0.01',
            'payment_method'           => 'required|in:MOBILE_MONEY,CARD',
            // Le compte sur lequel l'acheteur veut recevoir ses fonds (currency_from)
            'buyer_method_payment_id'  => 'required|integer|exists:method_payments,method_payment_id',
        ]);

        /** @var Utilisateur $buyer */
        $buyer   = Auth::user();
        $listing = Listing::with(['utilisateur', 'paymentMethod'])->findOrFail($validated['listing_id']);

        // Vérifier que ce compte appartient bien à l'acheteur
        $buyerMethod = MethodPayment::where('method_payment_id', $validated['buyer_method_payment_id'])
            ->where('user_id', $buyer->user_id)
            ->first();

        if (!$buyerMethod) {
            return response()->json(['message' => 'Ce compte de réception ne vous appartient pas.'], 403);
        }

        if ($listing->user_id === $buyer->user_id) {
            return response()->json(['message' => 'Vous ne pouvez pas acheter votre propre annonce.'], 422);
        }

        if ((float) $listing->amount_available < (float) $validated['amount_from']) {
            return response()->json([
                'message' => 'Montant demandé supérieur au disponible.', 'available' => $listing->amount_available,
            ], 422);
        }

        if ($listing->min_amount > 0 && $validated['amount_from'] < $listing->min_amount) {
            return response()->json([
                'message' => "Le montant minimum est {$listing->min_amount} {$listing->currency_from}.",
            ], 422);
        }

        $exchangeRate        = (float) $listing->user_rate;
        $amountFrom          = (float) $validated['amount_from'];
        $amountTo            = round($amountFrom * $exchangeRate, 2);
        $buyerFee            = round($amountTo * 0.01, 2);
        $sellerFee           = round($amountFrom * 0.01, 2);
        $totalChargedToBuyer = round($amountTo + $buyerFee, 2);

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
            ]);

            $flwTxRef = $transaction->generateFlwTxRef();
            $transaction->update(['flw_tx_ref' => $flwTxRef]);

            $payment = Payment::create([
                'user_id'           => $buyer->user_id,
                'transaction_id'    => $transaction->transaction_id,
                'method_payment_id' => null,
                'amount'            => $totalChargedToBuyer,
                'currency'          => $listing->currency_to,
            ]);

            $pendingStatus = PaymentStatus::firstOrCreate(['title' => 'PENDING']);
            PaymentHistory::create([
                'payment_id'        => $payment->payment_id,
                'payment_status_id' => $pendingStatus->payment_status_id,
                'date'              => now(),
            ]);

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('TransactionController@initiate: Erreur DB', ['msg' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur création.', 'error' => $e->getMessage()], 500);
        }

        $flwResult = $this->flwService->initializePayment([
            'tx_ref'          => $flwTxRef,
            'amount'          => $totalChargedToBuyer,
            'currency'        => $listing->currency_to,
            'customer_email'  => $buyer->email,
            'customer_name'   => trim($buyer->firstname . ' ' . $buyer->lastname),
            'payment_options' => $validated['payment_method'] === 'MOBILE_MONEY' ? 'mobilemoney' : 'card',
            'redirect_url'    => config('app.frontend_url') . '/payment/callback?tx_ref=' . $flwTxRef,
            'description'     => "Échange {$amountFrom} {$listing->currency_from} → {$amountTo} {$listing->currency_to}",
            'meta'            => ['transaction_id' => $transaction->transaction_id, 'role' => 'buyer'],
        ]);

        if (!$flwResult['success']) {
            $transaction->update(['status' => Transaction::STATUS_CANCELLED]);
            $failedStatus = PaymentStatus::firstOrCreate(['title' => 'FAILED']);
            PaymentHistory::create([
                'payment_id'        => $payment->payment_id,
                'payment_status_id' => $failedStatus->payment_status_id,
                'date'              => now(),
            ]);
            return response()->json(['message' => "Impossible d'initialiser.", 'error' => $flwResult['message']], 502);
        }

        return response()->json([
            'message'        => 'Transaction initiée',
            'payment_link'   => $flwResult['payment_link'],
            'transaction_id' => $transaction->transaction_id,
            'flw_tx_ref'     => $flwTxRef,
            'summary' => [
                'amount_from'   => $amountFrom, 'currency_from' => $listing->currency_from,
                'amount_to'     => $amountTo,   'currency_to'   => $listing->currency_to,
                'buyer_fee'     => $buyerFee,   'total_to_pay'  => $totalChargedToBuyer,
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
        $seller      = Auth::user();
        $transaction = Transaction::with(['listing', 'buyer', 'seller'])->findOrFail($id);

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
            'status'            => Transaction::STATUS_AWAITING_SELLER_PAYMENT,
            'flw_seller_tx_ref' => $flwSellerTxRef,
        ]);

        $flwResult = $this->flwService->initializePayment([
            'tx_ref'          => $flwSellerTxRef,
            'amount'          => $totalSellerCharge,
            'currency'        => $listing->currency_from,
            'customer_email'  => $seller->email,
            'customer_name'   => trim($seller->firstname . ' ' . $seller->lastname),
            'payment_options' => 'mobilemoney,card',
            'redirect_url'    => config('app.frontend_url') . '/payment/seller-callback?tx_ref=' . $flwSellerTxRef,
            'description'     => "Envoi {$amountFrom} {$listing->currency_from} — échange #{$transaction->transaction_id}",
            'meta'            => ['transaction_id' => $transaction->transaction_id, 'role' => 'seller'],
        ]);

        if (!$flwResult['success']) {
            $transaction->update(['status' => Transaction::STATUS_AWAITING_SELLER, 'flw_seller_tx_ref' => null]);
            return response()->json(['message' => 'Impossible de générer le lien.', 'error' => $flwResult['message']], 502);
        }

        $this->notificationService->notifyBuyerAccepted($transaction);

        return response()->json([
            'message'      => 'Accepté. Procédez au paiement.',
            'payment_link' => $flwResult['payment_link'],
            'summary'      => [
                'amount_to_send' => $amountFrom, 'seller_fee' => $sellerFee,
                'total_charged'  => $totalSellerCharge, 'currency' => $listing->currency_from,
            ],
        ]);
    }

    // ===========================================================
    // ANNULATION
    // ===========================================================

    public function cancel(int $id)
    {
        /** @var Utilisateur $seller */
        $seller      = Auth::user();
        $transaction = Transaction::with(['listing', 'buyer', 'seller'])->findOrFail($id);

        if ($transaction->seller_id !== $seller->user_id) {
            return response()->json(['message' => 'Action non autorisée.'], 403);
        }

        if ($transaction->status !== Transaction::STATUS_AWAITING_SELLER) {
            return response()->json(['message' => "Statut invalide : {$transaction->status}."], 422);
        }

        if (!$transaction->flw_tx_id) {
            return response()->json(['message' => 'Référence Flutterwave introuvable.'], 500);
        }

        $refundResult = $this->flwService->refundTransaction($transaction->flw_tx_id);
        $transaction->update(['status' => Transaction::STATUS_CANCELLED]);
        $this->notificationService->notifyBuyerCancelled($transaction);

        if (!$refundResult['success']) {
            return response()->json([
                'message'      => 'Annulée, remboursement automatique échoué.',
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
    public function disburseFunds(Transaction $transaction): void
    {
        $listing = $transaction->listing;

        // --- Transfer 1 : Acheteur ← currency_from (ex: USD) ---
        $buyerMethod = $transaction->buyerMethodPayment;

        if (!$buyerMethod) {
            Log::critical('TransactionController@disburseFunds: buyerMethodPayment manquant', [
                'transaction_id' => $transaction->transaction_id,
            ]);
            $this->notificationService->notifyTransferFailed(
                $transaction->buyer_id,
                (float) $transaction->amount_from,
                $listing->currency_from,
                $transaction->transaction_id
            );
        } else {
            $buyerTransferResult = $this->flwService->createTransfer([
                // Ref: https://developer.flutterwave.com/reference/endpoints/transfers#create-a-transfer
                'account_bank'     => $buyerMethod->bank_code ?? $buyerMethod->provider,
                'account_number'   => $buyerMethod->account_number,
                'amount'           => (float) $transaction->amount_from,      // USD
                'currency'         => $listing->currency_from,                // USD
                'narration'        => "ExchaPay — Échange #{$transaction->transaction_id}",
                'reference'        => 'EXCHA-BUYER-' . $transaction->transaction_id . '-' . time(),
                'beneficiary_name' => $buyerMethod->account_name,
            ]);

            if ($buyerTransferResult['success']) {
                $accountInfo = strtoupper($buyerMethod->provider) . ' — ' . $buyerMethod->account_number;
                $this->notificationService->notifyTransferSuccess(
                    $transaction->buyer_id,
                    (float) $transaction->amount_from,
                    $listing->currency_from,
                    $accountInfo
                );
                Log::info('TransactionController@disburseFunds: Transfer acheteur OK', [
                    'transaction_id' => $transaction->transaction_id,
                    'buyer_id'       => $transaction->buyer_id,
                    'amount'         => $transaction->amount_from,
                    'currency'       => $listing->currency_from,
                ]);
            } else {
                Log::critical('TransactionController@disburseFunds: Transfer acheteur ÉCHOUÉ', [
                    'transaction_id' => $transaction->transaction_id,
                    'error'          => $buyerTransferResult['message'],
                ]);
                $this->notificationService->notifyTransferFailed(
                    $transaction->buyer_id,
                    (float) $transaction->amount_from,
                    $listing->currency_from,
                    $transaction->transaction_id
                );
            }
        }

        // --- Transfer 2 : Vendeur ← currency_to net de frais (ex: XAF) ---
        $sellerMethod = $listing->paymentMethod; // Défini lors de la création de l'annonce

        $sellerNetAmount = round((float) $transaction->amount_to - (float) $transaction->seller_fee, 2);

        if (!$sellerMethod) {
            Log::critical('TransactionController@disburseFunds: sellerMethodPayment manquant', [
                'transaction_id' => $transaction->transaction_id,
            ]);
            $this->notificationService->notifyTransferFailed(
                $transaction->seller_id,
                $sellerNetAmount,
                $listing->currency_to,
                $transaction->transaction_id
            );
        } else {
            $sellerTransferResult = $this->flwService->createTransfer([
                'account_bank'     => $sellerMethod->bank_code ?? $sellerMethod->provider,
                'account_number'   => $sellerMethod->account_number,
                'amount'           => $sellerNetAmount,                 // XAF net
                'currency'         => $listing->currency_to,            // XAF
                'narration'        => "ExchaPay — Échange #{$transaction->transaction_id}",
                'reference'        => 'EXCHA-SELLER-' . $transaction->transaction_id . '-' . time(),
                'beneficiary_name' => $sellerMethod->account_name,
            ]);

            if ($sellerTransferResult['success']) {
                $accountInfo = strtoupper($sellerMethod->provider) . ' — ' . $sellerMethod->account_number;
                $this->notificationService->notifyTransferSuccess(
                    $transaction->seller_id,
                    $sellerNetAmount,
                    $listing->currency_to,
                    $accountInfo
                );
                Log::info('TransactionController@disburseFunds: Transfer vendeur OK', [
                    'transaction_id' => $transaction->transaction_id,
                    'seller_id'      => $transaction->seller_id,
                    'amount'         => $sellerNetAmount,
                    'currency'       => $listing->currency_to,
                ]);
            } else {
                Log::critical('TransactionController@disburseFunds: Transfer vendeur ÉCHOUÉ', [
                    'transaction_id' => $transaction->transaction_id,
                    'error'          => $sellerTransferResult['message'],
                ]);
                $this->notificationService->notifyTransferFailed(
                    $transaction->seller_id,
                    $sellerNetAmount,
                    $listing->currency_to,
                    $transaction->transaction_id
                );
            }
        }
    }

    // ===========================================================
    // UTILITAIRES
    // ===========================================================

    public function status(Request $request)
    {
        $txRef = $request->query('tx_ref');
        if (!$txRef) return response()->json(['message' => 'tx_ref requis'], 400);

        $tx = Transaction::where(function ($q) use ($txRef) {
                $q->where('flw_tx_ref', $txRef)->orWhere('flw_seller_tx_ref', $txRef);
            })
            ->where(function ($q) {
                $userId = Auth::id();
                $q->where('buyer_id', $userId)->orWhere('seller_id', $userId);
            })
            ->first();

        if (!$tx) return response()->json(['message' => 'Transaction introuvable'], 404);

        return response()->json([
            'status' => $tx->status, 'transaction_id' => $tx->transaction_id, 'flw_tx_ref' => $tx->flw_tx_ref,
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