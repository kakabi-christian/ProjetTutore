<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PaymentHistory;
use App\Models\PaymentStatus;
use App\Models\Transaction;
use App\Services\FlutterwaveService;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * WebhookController
 *
 * TYPE A (EXCHA-{id})     → Paiement acheteur → AWAITING_SELLER
 * TYPE B (EXCHA-S-{id})   → Paiement vendeur  → COMPLETED + disburseFunds()
 *
 * Ref: https://developer.flutterwave.com/docs/integration-guides/webhooks
 */
class WebhookController extends Controller
{
    protected FlutterwaveService $flwService;

    protected NotificationService $notificationService;
    protected TransactionController $transactionController;

    public function __construct(
        FlutterwaveService $flwService,
        NotificationService $notificationService,
        TransactionController $transactionController
    ) {
        $this->flwService            = $flwService;
        $this->notificationService   = $notificationService;
        $this->transactionController = $transactionController;
    }

    public function handle(Request $request)
    {
        // --- Vérification signature ---
        // Ref: https://developer.flutterwave.com/docs/integration-guides/webhooks#verifying-webhooks
        $webhookHash = $request->header('verif-hash');
        $expectedHash = config('flutterwave.webhookHash');

        if (! $webhookHash || $webhookHash !== $expectedHash) {
            Log::warning('WebhookController: Signature invalide', [
                'received_hash' => $webhookHash, 'ip' => $request->ip(),
            ]);

            return response()->json(['message' => 'Signature invalide'], 200);
        }

        $payload = $request->all();
        $event = $payload['event'] ?? '';

        Log::info('WebhookController: Webhook reçu', [
            'event' => $event,
            'tx_ref' => $payload['data']['tx_ref'] ?? null,
        ]);

        if ($event !== 'charge.completed') {
            return response()->json(['message' => 'Événement non géré'], 200);
        }

        $flwData = $payload['data'] ?? [];
        $flwTransactionId = (string) ($flwData['id'] ?? '');
        $txRef = $flwData['tx_ref'] ?? '';

        if (! $flwTransactionId || ! $txRef) {
            Log::error('WebhookController: Payload incomplet', $payload);

            return response()->json(['message' => 'Payload invalide'], 200);
        }

        return str_starts_with($txRef, 'EXCHA-S-')
            ? $this->handleSellerPayment($txRef, $flwTransactionId)
            : $this->handleBuyerPayment($txRef, $flwTransactionId);
    }

    // ===========================================================
    // TYPE A — Paiement acheteur → AWAITING_SELLER
    // ===========================================================

    private function handleBuyerPayment(string $txRef, string $flwTransactionId)
    {
        $transaction = Transaction::where('flw_tx_ref', $txRef)
            ->with(['payments', 'listing', 'buyer', 'seller'])
            ->first();

        if (! $transaction) {
            Log::error('WebhookController@handleBuyerPayment: Transaction introuvable', ['tx_ref' => $txRef]);

            return response()->json(['message' => 'Transaction introuvable'], 200);
        }

        // Idempotence
        if (! in_array($transaction->status, [Transaction::STATUS_PENDING])) {
            Log::info('WebhookController@handleBuyerPayment: Déjà traité', [
                'transaction_id' => $transaction->transaction_id,
                'status' => $transaction->status,
            ]);

            return response()->json(['message' => 'Déjà traité'], 200);
        }

        // Vérification Flutterwave
        // Ref: https://developer.flutterwave.com/reference/endpoints/transactions#verify-a-transaction
        $verification = $this->flwService->verifyTransaction($flwTransactionId);
        if (! $verification['success']) {
            Log::error('WebhookController@handleBuyerPayment: Vérification échouée');

            return response()->json(['message' => 'Vérification échouée'], 200);
        }

        $verifiedData = $verification['data'];
        $payment = $transaction->payments()->first();

        // Anti-fraude
        $amountMatch = abs((float) $verifiedData['amount'] - (float) $payment->amount) < 0.01;
        $currencyMatch = strtoupper($verifiedData['currency']) === strtoupper($payment->currency);
        $statusOk = strtolower($verifiedData['status']) === 'successful';

        if (! $amountMatch || ! $currencyMatch || ! $statusOk) {
            Log::critical('WebhookController@handleBuyerPayment: FRAUDE détectée', [
                'transaction_id' => $transaction->transaction_id,
                'expected_amount' => $payment->amount,
                'received_amount' => $verifiedData['amount'],
                'expected_currency' => $payment->currency,
                'received_currency' => $verifiedData['currency'],
            ]);
            $transaction->update(['status' => Transaction::STATUS_CANCELLED]);
            $failedStatus = PaymentStatus::firstOrCreate(['title' => 'FAILED']);
            PaymentHistory::create([
                'payment_id' => $payment->payment_id,
                'payment_status_id' => $failedStatus->payment_status_id,
                'date' => now(),
            ]);

            return response()->json(['message' => 'Incohérence détectée'], 200);
        }

        try {
            DB::beginTransaction();

            $payment->update([
                'provider' => $verifiedData['payment_type'] ?? null,
                'flw_payment_id' => $flwTransactionId,
                'paid_at' => now(),
            ]);

            $successStatus = PaymentStatus::firstOrCreate(['title' => 'SUCCESS']);
            PaymentHistory::create([
                'payment_id' => $payment->payment_id,
                'payment_status_id' => $successStatus->payment_status_id,
                'date' => now(),
            ]);

            $transaction->update([
                'status' => Transaction::STATUS_AWAITING_SELLER,
                'flw_tx_id' => $flwTransactionId,
            ]);

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::emergency('WebhookController@handleBuyerPayment: Erreur DB', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur interne'], 200);
        }

        $this->notificationService->notifyBuyer($transaction);
        $this->notificationService->notifySeller($transaction);

        Log::info('WebhookController@handleBuyerPayment: OK → AWAITING_SELLER', [
            'transaction_id' => $transaction->transaction_id,
        ]);

        return response()->json(['message' => 'Paiement acheteur traité'], 200);
    }

    // ===========================================================
    // TYPE B — Paiement vendeur → COMPLETED + disburseFunds
    // ===========================================================

    private function handleSellerPayment(string $txRef, string $flwTransactionId)
    {
        $transaction = Transaction::where('flw_seller_tx_ref', $txRef)
            ->with(['listing', 'buyer', 'seller', 'buyerMethodPayment'])
            ->first();

        if (! $transaction) {
            Log::error('WebhookController@handleSellerPayment: Transaction introuvable', ['tx_ref' => $txRef]);

            return response()->json(['message' => 'Transaction introuvable'], 200);
        }

        if ($transaction->status === Transaction::STATUS_COMPLETED) {
            return response()->json(['message' => 'Déjà traité'], 200);
        }

        if ($transaction->status !== Transaction::STATUS_AWAITING_SELLER_PAYMENT) {
            Log::warning('WebhookController@handleSellerPayment: Statut inattendu', [
                'transaction_id' => $transaction->transaction_id, 'status' => $transaction->status,
                'transaction_id' => $transaction->transaction_id,
                'status' => $transaction->status,
            ]);

            return response()->json(['message' => 'Statut inattendu'], 200);
        }

        // Vérification Flutterwave
        $verification = $this->flwService->verifyTransaction($flwTransactionId);
        if (! $verification['success']) {
            Log::error('WebhookController@handleSellerPayment: Vérification échouée');

            return response()->json(['message' => 'Vérification échouée'], 200);
        }

        $verifiedData = $verification['data'];
        $listing = $transaction->listing;

        // Anti-fraude : vérifier que le vendeur a bien payé le bon montant en bonne devise
        $expectedAmount = round((float) $transaction->amount_from + (float) $transaction->seller_fee, 2);
        $expectedCurrency = strtoupper($listing->currency_from); // USD

        $amountMatch = abs((float) $verifiedData['amount'] - $expectedAmount) < 0.01;
        $currencyMatch = strtoupper($verifiedData['currency']) === $expectedCurrency;
        $statusOk = strtolower($verifiedData['status']) === 'successful';

        if (! $amountMatch || ! $currencyMatch || ! $statusOk) {
            Log::critical('WebhookController@handleSellerPayment: Incohérence détectée', [
                'transaction_id' => $transaction->transaction_id,
                'expected_amount' => $expectedAmount,
                'received_amount' => $verifiedData['amount'],
                'expected_currency' => $expectedCurrency,
                'received_currency' => $verifiedData['currency'],
            ]);

            // On ne cancel pas — on attend une investigation manuelle
            return response()->json(['message' => 'Incohérence détectée — investigation requise'], 200);
        }

        // Marquer COMPLETED
        try {
            DB::beginTransaction();

            $transaction->update([
                'status' => Transaction::STATUS_COMPLETED,
                'flw_seller_tx_id' => $flwTransactionId,
            ]);

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::emergency('WebhookController@handleSellerPayment: Erreur DB', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur interne'], 200);
        }

        // Notifier que l'échange est finalisé
        $this->notificationService->notifyBuyerSellerPaid($transaction);

        Log::info('WebhookController@handleSellerPayment: OK → COMPLETED', [
            'transaction_id' => $transaction->transaction_id,
        ]);

        // ─── Phase 3 : Libération des fonds ──────────────────────────────
        // Appelé APRÈS commit — un échec ici ne rollback pas COMPLETED.
        // Les fonds sont bien reçus par la plateforme, le disbursement
        // peut être rejoué manuellement si nécessaire.
        $this->transactionController->disburseFunds($transaction);

        return response()->json(['message' => 'Paiement vendeur traité → COMPLETED + disbursement lancé'], 200);
    }
}
