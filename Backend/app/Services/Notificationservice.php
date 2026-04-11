<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\Transaction;
use Illuminate\Support\Facades\Log;

/**
 * NotificationService
 *
 * Centralise la création de notifications liées aux transactions.
 * Appelé après chaque événement métier significatif (paiement confirmé,
 * transaction annulée, etc.)
 *
 * Utilise directement Notification::create() — pas de FormRequest
 * car on est côté service interne, pas côté HTTP.
 */
class NotificationService
{
    /**
     * Notifie l'ACHETEUR que son paiement a été reçu.
     *
     * Déclencheur : WebhookController après confirmation Flutterwave.
     *
     * Message : "Votre paiement a été reçu. Le vendeur a 24h pour valider
     *            l'échange. En cas de non-réponse, vous serez remboursé
     *            automatiquement."
     *
     * Type : INFO (3) — bleu, informatif, pas urgent
     */
    public function notifyBuyer(Transaction $transaction): void
    {
        try {
            $listing  = $transaction->listing;
            $seller   = $transaction->seller;

            $sellerName    = $seller
                ? trim($seller->firstname . ' ' . $seller->lastname)
                : 'le vendeur';

            $amountFrom    = number_format((float) $transaction->amount_from, 2);
            $amountTo      = number_format((float) $transaction->amount_to, 2);
            $currencyFrom  = $listing?->currency_from ?? '';
            $currencyTo    = $listing?->currency_to ?? '';

            Notification::create([
                'user_id'      => $transaction->buyer_id,
                'is_broadcast' => false,
                'type'         => Notification::TYPE_INFO,
                'title'        => 'Paiement reçu — En attente de validation',
                'message'      => "Votre paiement de {$amountTo} {$currencyTo} a bien été reçu. "
                    . "{$sellerName} a 24h pour valider l'échange et vous envoyer "
                    . "{$amountFrom} {$currencyFrom}. "
                    . "Sans réponse de sa part, vous serez intégralement remboursé.",
                'is_read'      => false,
            ]);

            Log::info("NotificationService@notifyBuyer: Notif envoyée", [
                'buyer_id'       => $transaction->buyer_id,
                'transaction_id' => $transaction->transaction_id,
            ]);

        } catch (\Exception $e) {
            // On log l'erreur mais on ne fait pas planter le webhook
            Log::error("NotificationService@notifyBuyer: Échec", [
                'transaction_id' => $transaction->transaction_id,
                'error'          => $e->getMessage(),
            ]);
        }
    }

    /**
     * Notifie le VENDEUR qu'une transaction a été initiée sur son annonce.
     *
     * Déclencheur : WebhookController après confirmation Flutterwave.
     *
     * Message : "X a effectué un paiement pour votre annonce. Vous avez 24h
     *            pour accepter ou annuler. Sans réponse, la transaction sera
     *            automatiquement annulée et l'acheteur remboursé."
     *
     * Type : WARNING (4) — orange, action requise
     */
    public function notifySeller(Transaction $transaction): void
    {
        try {
            $listing  = $transaction->listing;
            $buyer    = $transaction->buyer;

            $buyerName     = $buyer
                ? trim($buyer->firstname . ' ' . $buyer->lastname)
                : 'Un acheteur';

            $amountFrom    = number_format((float) $transaction->amount_from, 2);
            $amountTo      = number_format((float) $transaction->amount_to, 2);
            $currencyFrom  = $listing?->currency_from ?? '';
            $currencyTo    = $listing?->currency_to ?? '';
            $listingDesc   = $listing
                ? "{$amountFrom} {$currencyFrom} → {$amountTo} {$currencyTo}"
                : "transaction #{$transaction->transaction_id}";

            Notification::create([
                'user_id'      => $transaction->seller_id,
                'is_broadcast' => false,
                'type'         => Notification::TYPE_WARNING,
                'title'        => 'Nouvelle transaction sur votre annonce',
                'message'      => "{$buyerName} a effectué un paiement de {$amountTo} {$currencyTo} "
                    . "pour votre offre ({$listingDesc}). "
                    . "Vous avez 24h pour accepter et procéder à l'envoi de {$amountFrom} {$currencyFrom}, "
                    . "ou annuler la transaction. "
                    . "Sans action de votre part, la transaction sera annulée et l'acheteur remboursé.",
                'is_read'      => false,
            ]);

            Log::info("NotificationService@notifySeller: Notif envoyée", [
                'seller_id'      => $transaction->seller_id,
                'transaction_id' => $transaction->transaction_id,
            ]);

        } catch (\Exception $e) {
            Log::error("NotificationService@notifySeller: Échec", [
                'transaction_id' => $transaction->transaction_id,
                'error'          => $e->getMessage(),
            ]);
        }
    }
}