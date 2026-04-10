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
        // --- Flutterwave ---
        'flw_tx_ref',           // Notre référence unique qu'on génère
        'flw_tx_id',            // L'ID retourné par Flutterwave après paiement
        'buyer_payment_method', // MOBILE_MONEY | CARD
    ];

    protected $casts = [
        'amount_from'  => 'float',
        'amount_to'    => 'float',
        'exchange_rate'=> 'float',
        'buyer_fee'    => 'float',
        'seller_fee'   => 'float',
        'created_at'   => 'datetime',
        'updated_at'   => 'datetime',
    ];

    // -------------------------------------------------------
    // Constantes de statut — évite les magic strings partout
    // -------------------------------------------------------
    const STATUS_PENDING   = 'PENDING';
    const STATUS_COMPLETED = 'COMPLETED';
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
        return 'EXCHA-' . $this->transaction_id . '-' . time();
    }

    /**
     * Vérifie si la transaction est encore en attente de paiement.
     */
    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }
}