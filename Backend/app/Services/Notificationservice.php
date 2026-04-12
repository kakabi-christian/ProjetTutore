<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\Transaction;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    public function notifyBuyer(Transaction $transaction): void
    {
        try {
            $listing    = $transaction->listing;
            $seller     = $transaction->seller;
            $sellerName = $seller ? trim($seller->firstname . ' ' . $seller->lastname) : 'le vendeur';
            $amountFrom = number_format((float) $transaction->amount_from, 2);
            $amountTo   = number_format((float) $transaction->amount_to, 2);
            $cFrom      = $listing?->currency_from ?? '';
            $cTo        = $listing?->currency_to ?? '';

            Notification::create([
                'user_id' => $transaction->buyer_id, 'is_broadcast' => false,
                'type'    => Notification::TYPE_INFO,
                'title'   => 'Paiement reçu — En attente de validation',
                'message' => "Votre paiement de {$amountTo} {$cTo} a bien été reçu. "
                    . "{$sellerName} a 24h pour accepter et vous envoyer {$amountFrom} {$cFrom}. "
                    . "Sans réponse, vous serez intégralement remboursé.",
                'is_read' => false,
            ]);
        } catch (\Exception $e) {
            Log::error("NotificationService@notifyBuyer", ['error' => $e->getMessage()]);
        }
    }

    public function notifySeller(Transaction $transaction): void
    {
        try {
            $listing    = $transaction->listing;
            $buyer      = $transaction->buyer;
            $buyerName  = $buyer ? trim($buyer->firstname . ' ' . $buyer->lastname) : 'Un acheteur';
            $amountFrom = number_format((float) $transaction->amount_from, 2);
            $amountTo   = number_format((float) $transaction->amount_to, 2);
            $cFrom      = $listing?->currency_from ?? '';
            $cTo        = $listing?->currency_to ?? '';

            Notification::create([
                'user_id' => $transaction->seller_id, 'is_broadcast' => false,
                'type'    => Notification::TYPE_WARNING,
                'title'   => 'Nouvelle transaction sur votre annonce',
                'message' => "{$buyerName} a payé {$amountTo} {$cTo} pour votre offre "
                    . "({$amountFrom} {$cFrom}). Acceptez pour procéder à votre versement "
                    . "de {$amountFrom} {$cFrom}, ou annulez pour rembourser l'acheteur. Vous avez 24h.",
                'is_read' => false,
            ]);
        } catch (\Exception $e) {
            Log::error("NotificationService@notifySeller", ['error' => $e->getMessage()]);
        }
    }

    public function notifyBuyerAccepted(Transaction $transaction): void
    {
        try {
            $listing    = $transaction->listing;
            $seller     = $transaction->seller;
            $sellerName = $seller ? trim($seller->firstname . ' ' . $seller->lastname) : 'Le vendeur';
            $amountFrom = number_format((float) $transaction->amount_from, 2);
            $cFrom      = $listing?->currency_from ?? '';

            Notification::create([
                'user_id' => $transaction->buyer_id, 'is_broadcast' => false,
                'type'    => Notification::TYPE_SUCCESS,
                'title'   => 'Échange accepté — Paiement vendeur en cours',
                'message' => "{$sellerName} a accepté et procède à l'envoi de {$amountFrom} {$cFrom} "
                    . "à la plateforme. Vous serez notifié dès confirmation.",
                'is_read' => false,
            ]);
        } catch (\Exception $e) {
            Log::error("NotificationService@notifyBuyerAccepted", ['error' => $e->getMessage()]);
        }
    }

    public function notifyBuyerSellerPaid(Transaction $transaction): void
    {
        try {
            $listing    = $transaction->listing;
            $amountFrom = number_format((float) $transaction->amount_from, 2);
            $cFrom      = $listing?->currency_from ?? '';

            Notification::create([
                'user_id' => $transaction->buyer_id, 'is_broadcast' => false,
                'type'    => Notification::TYPE_SUCCESS,
                'title'   => 'Échange finalisé — Fonds en route',
                'message' => "Le vendeur a confirmé l'envoi de {$amountFrom} {$cFrom}. "
                    . "La plateforme va traiter le transfert. "
                    . "Contactez le support si vous n'avez rien reçu sous 24h.",
                'is_read' => false,
            ]);
        } catch (\Exception $e) {
            Log::error("NotificationService@notifyBuyerSellerPaid", ['error' => $e->getMessage()]);
        }
    }

    public function notifyBuyerCancelled(Transaction $transaction): void
    {
        try {
            $listing  = $transaction->listing;
            $amountTo = number_format((float) $transaction->amount_to, 2);
            $cTo      = $listing?->currency_to ?? '';

            Notification::create([
                'user_id' => $transaction->buyer_id, 'is_broadcast' => false,
                'type'    => Notification::TYPE_ERROR,
                'title'   => 'Échange annulé — Remboursement en cours',
                'message' => "Le vendeur a annulé votre échange. "
                    . "Un remboursement de {$amountTo} {$cTo} a été initié. "
                    . "Délai : 3 à 5 jours ouvrés. Contactez le support si besoin.",
                'is_read' => false,
            ]);
        } catch (\Exception $e) {
            Log::error("NotificationService@notifyBuyerCancelled", ['error' => $e->getMessage()]);
        }
    }
}