<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\PaymentHistory;
use App\Models\PaymentStatus;
use App\Models\Transaction;
use App\Services\FlutterwaveService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * WebhookController — Réception des notifications Flutterwave
 *
 * IMPORTANT : Cette route doit être EXCLUE du middleware `auth:sanctum`.
 * Flutterwave appelle cette URL de façon asynchrone, sans token JWT.
 * La sécurité est assurée par la vérification du `verif-hash`.
 *
 * Ref: https://developer.flutterwave.com/docs/integration-guides/webhooks
 *
 * Pour tester en local avec ngrok :
 *   1. ngrok http 8000
 *   2. Coller dans Flutterwave Dashboard → Settings → Webhooks → URL :
 *      https://[ton-id].ngrok-free.app/api/webhooks/flutterwave
 *   3. Définir FLW_WEBHOOK_HASH dans .env avec la même valeur que le "Secret hash"
 */
class WebhookController extends Controller
{
    protected FlutterwaveService $flwService;

    public function __construct(FlutterwaveService $flwService)
    {
        $this->flwService = $flwService;
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
            // On retourne 200 pour éviter les retries Flutterwave
            return response()->json(['message' => 'Signature invalide'], 200);
        }

        $payload = $request->all();

        Log::info("WebhookController: Webhook reçu", [
            'event'  => $payload['event'] ?? 'unknown',
            'tx_ref' => $payload['data']['tx_ref'] ?? null,
        ]);

        // --- 2. On ne traite que les paiements complétés ---
        // Ref: https://developer.flutterwave.com/docs/integration-guides/webhooks#webhook-events
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
            ->with(['payments.histories.paymentStatus', 'listing', 'escrow'])
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

            // Annuler la transaction et logger un PaymentHistory FAILED
            $transaction->update(['status' => Transaction::STATUS_CANCELLED]);

            $failedStatus = PaymentStatus::firstOrCreate(['status' => 'FAILED']);
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

            // 7b. Ajouter un PaymentHistory SUCCESS
            $successStatus = PaymentStatus::firstOrCreate(['status' => 'SUCCESS']);
            PaymentHistory::create([
                'payment_id'        => $payment->payment_id,
                'payment_status_id' => $successStatus->payment_status_id,
                'date'              => now(),
            ]);

            // 7c. Finaliser la Transaction
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

            Log::info("WebhookController: Transaction finalisée", [
                'transaction_id' => $transaction->transaction_id,
                'buyer_id'       => $transaction->buyer_id,
                'seller_id'      => $transaction->seller_id,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::emergency("WebhookController: Erreur finalisation", [
                'transaction_id' => $transaction->transaction_id,
                'error'          => $e->getMessage(),
            ]);
            return response()->json(['message' => 'Erreur interne'], 200);
        }

        // Toujours 200 à Flutterwave pour stopper les retries
        return response()->json(['message' => 'Paiement traité avec succès'], 200);
    }
}