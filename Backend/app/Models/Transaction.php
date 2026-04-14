<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Transaction extends Model
{
    use HasFactory;

    protected $table = 'transactions';

    protected $primaryKey = 'transaction_id';

    protected $fillable = [
        'buyer_id',
        'seller_id',
        'listing_id',
        'amount_from',
        'amount_to',
        'exchange_rate',
        'buyer_fee',
        'seller_fee',
        'status',
        // --- Flutterwave --- Paiement acheteur
        'flw_tx_ref',           // Notre référence unique qu'on génère
        'flw_tx_id',            // L'ID retourné par Flutterwave après paiement
        'buyer_payment_method', // MOBILE_MONEY | CARD

        // Paiement vendeur
        'flw_seller_tx_ref',
        'flw_seller_tx_id',
    ];

    protected $casts = [
        'amount_from' => 'float',
        'amount_to' => 'float',
        'exchange_rate' => 'float',
        'buyer_fee' => 'float',
        'seller_fee' => 'float',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // -------------------------------------------------------
    // Statuts — flux complet
    // -------------------------------------------------------
    // Acheteur paie XAF à la plateforme
    const STATUS_PENDING = 'PENDING';

    // Paiement acheteur confirmé par webhook Flutterwave
    const STATUS_AWAITING_SELLER = 'AWAITING_SELLER';

    // Vendeur a accepté, lien de paiement généré, en attente de son paiement USD
    const STATUS_AWAITING_SELLER_PAYMENT = 'AWAITING_SELLER_PAYMENT';

    // Paiement vendeur confirmé → échange terminé
    const STATUS_COMPLETED = 'COMPLETED';

    // Annulé à n'importe quelle étape
    const STATUS_CANCELLED = 'CANCELLED';
    // -------------------------------------------------------
    // Relations
    // -------------------------------------------------------

    public function buyer(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'buyer_id', 'user_id');
    }

    public function seller(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'seller_id', 'user_id');
    }

    public function listing(): BelongsTo
    {
        return $this->belongsTo(Listing::class, 'listing_id', 'listing_id');
    }

    public function escrow(): HasOne
    {
        return $this->hasOne(Escrow::class, 'transaction_id', 'transaction_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class, 'transaction_id', 'transaction_id');
    }

    // -------------------------------------------------------
    // Helpers
    // -------------------------------------------------------

    /**
     * Génère une référence unique pour Flutterwave.
     * Format : EXCHA-{transaction_id}-{timestamp}
     * Appelé juste après la création de la transaction.
     */
    public function generateFlwTxRef(): string
    {
        return 'EXCHA-'.$this->transaction_id.'-'.time();
    }

    /**
     * Référence Flutterwave pour le paiement VENDEUR.
     * Format : EXCHA-S-{id}-{timestamp}
     * Préfixe "S" permet au webhook de distinguer les deux types.
     */
    public function generateFlwSellerTxRef(): string
    {
        return 'EXCHA-S-'.$this->transaction_id.'-'.time();
    }

    /**
     * Vérifie si la transaction est encore en attente de paiement.
     */
    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function isAwaitingSeller(): bool
    {
        return $this->status === self::STATUS_AWAITING_SELLER;
    }
}
