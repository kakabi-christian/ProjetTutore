<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\PaymentHistory;
use App\Models\PaymentStatus;
use App\Models\Transaction;
use App\Services\FlutterwaveService;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * WebhookController — Réception des notifications Flutterwave
 *
 * IMPORTANT : Route EXCLUE du middleware auth:sanctum.
 * Sécurité assurée par la vérification du header `verif-hash`.
 *
 * Ref: https://developer.flutterwave.com/docs/integration-guides/webhooks
 */
class WebhookController extends Controller
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

    /**
     * Point d'entrée du webhook Flutterwave.
     * POST /api/webhooks/flutterwave
     *
     * Ref: https://developer.flutterwave.com/docs/integration-guides/webhooks#webhook-events
     */
    public function handle(Request $request)
    {
        // --- 1. Vérification de la signature (verif-hash) ---
        // Ref: https://developer.flutterwave.com/docs/integration-guides/webhooks#verifying-webhooks
        $webhookHash  = $request->header('verif-hash');
        $expectedHash = config('flutterwave.webhookHash');

        if (!$webhookHash || $webhookHash !== $expectedHash) {
            Log::warning("WebhookController: Signature invalide", [
                'received_hash' => $webhookHash,
                'ip'            => $request->ip(),
            ]);
            return response()->json(['message' => 'Signature invalide'], 200);
        }

        $payload = $request->all();

        Log::info("WebhookController: Webhook reçu", [
            'event'  => $payload['event'] ?? 'unknown',
            'tx_ref' => $payload['data']['tx_ref'] ?? null,
        ]);

        // --- 2. On ne traite que les paiements complétés ---
        $event = $payload['event'] ?? '';

        if ($event !== 'charge.completed') {
            Log::info("WebhookController: Événement ignoré", ['event' => $event]);
            return response()->json(['message' => 'Événement non géré'], 200);
        }

        $flwData          = $payload['data'] ?? [];
        $flwTransactionId = (string) ($flwData['id'] ?? '');
        $txRef            = $flwData['tx_ref'] ?? '';

        if (!$flwTransactionId || !$txRef) {
            Log::error("WebhookController: Payload incomplet", $payload);
            return response()->json(['message' => 'Payload invalide'], 200);
        }

        // --- 3. Retrouver notre transaction via flw_tx_ref ---
        $transaction = Transaction::where('flw_tx_ref', $txRef)
            ->with(['payments.histories.paymentStatus', 'listing', 'escrow', 'buyer', 'seller'])
            ->first();

        if (!$transaction) {
            Log::error("WebhookController: Transaction introuvable", ['tx_ref' => $txRef]);
            return response()->json(['message' => 'Transaction introuvable'], 200);
        }

        // --- 4. Idempotence : ne pas traiter deux fois ---
        if ($transaction->status === Transaction::STATUS_COMPLETED) {
            Log::info("WebhookController: Transaction déjà traitée", [
                'transaction_id' => $transaction->transaction_id,
            ]);
            return response()->json(['message' => 'Déjà traité'], 200);
        }

        // --- 5. Vérification OBLIGATOIRE via l'API Flutterwave ---
        // Ne JAMAIS faire confiance au webhook seul sans re-vérifier.
        // Ref: https://developer.flutterwave.com/reference/endpoints/transactions#verify-a-transaction
        $verification = $this->flwService->verifyTransaction($flwTransactionId);

        if (!$verification['success']) {
            Log::error("WebhookController: Vérification Flutterwave échouée", [
                'transaction_id'     => $transaction->transaction_id,
                'flw_transaction_id' => $flwTransactionId,
            ]);
            return response()->json(['message' => 'Vérification échouée'], 200);
        }

        $verifiedData = $verification['data'];

        // --- 6. Double vérification montant + devise (anti-fraude) ---
        $payment = $transaction->payments()->first();

        $amountMatch   = abs((float) $verifiedData['amount'] - (float) $payment->amount) < 0.01;
        $currencyMatch = strtoupper($verifiedData['currency']) === strtoupper($payment->currency);
        $statusOk      = strtolower($verifiedData['status']) === 'successful';

        if (!$amountMatch || !$currencyMatch || !$statusOk) {
            Log::critical("WebhookController: FRAUDE ou incohérence détectée", [
                'transaction_id'    => $transaction->transaction_id,
                'expected_amount'   => $payment->amount,
                'received_amount'   => $verifiedData['amount'],
                'expected_currency' => $payment->currency,
                'received_currency' => $verifiedData['currency'],
                'flw_status'        => $verifiedData['status'],
            ]);

            $transaction->update(['status' => Transaction::STATUS_CANCELLED]);

            $failedStatus = PaymentStatus::firstOrCreate(['title' => 'FAILED']);
            PaymentHistory::create([
                'payment_id'        => $payment->payment_id,
                'payment_status_id' => $failedStatus->payment_status_id,
                'date'              => now(),
            ]);

            return response()->json(['message' => 'Incohérence détectée'], 200);
        }

        // --- 7. Tout est bon : finaliser en base de données ---
        try {
            DB::beginTransaction();

            // 7a. Mettre à jour les colonnes Flutterwave sur le Payment
            $payment->update([
                'provider'       => $verifiedData['payment_type'] ?? null,
                'flw_payment_id' => $flwTransactionId,
                'paid_at'        => now(),
            ]);

            // 7b. PaymentHistory → SUCCESS
            $successStatus = PaymentStatus::firstOrCreate(['title' => 'SUCCESS']);
            PaymentHistory::create([
                'payment_id'        => $payment->payment_id,
                'payment_status_id' => $successStatus->payment_status_id,
                'date'              => now(),
            ]);

            // 7c. Finaliser la Transaction → COMPLETED
            $transaction->update([
                'status'    => Transaction::STATUS_COMPLETED,
                'flw_tx_id' => $flwTransactionId,
            ]);

            // 7d. Libérer l'Escrow
            if ($transaction->escrow) {
                $transaction->escrow->update(['released_at' => now()]);
            }

            // 7e. Décrémenter le listing
            $listing = $transaction->listing;
            if ($listing) {
                $newAvailable = max(0, (float) $listing->amount_available - (float) $transaction->amount_from);
                $listing->update(['amount_available' => $newAvailable]);
            }

            DB::commit();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::emergency("WebhookController: Erreur finalisation", [
                'transaction_id' => $transaction->transaction_id,
                'error'          => $e->getMessage(),
            ]);
            return response()->json(['message' => 'Erreur interne'], 200);
        }

        // --- 8. Notifications — APRÈS le commit, hors transaction DB ---
        // Si une notif échoue, ça ne doit pas rollback le paiement.
        // Le try/catch est géré DANS chaque méthode du NotificationService.
        $this->notificationService->notifyBuyer($transaction);
        $this->notificationService->notifySeller($transaction);

        Log::info("WebhookController: Transaction finalisée et notifications envoyées", [
            'transaction_id' => $transaction->transaction_id,
            'buyer_id'       => $transaction->buyer_id,
            'seller_id'      => $transaction->seller_id,
        ]);

        return response()->json(['message' => 'Paiement traité avec succès'], 200);
    }
}