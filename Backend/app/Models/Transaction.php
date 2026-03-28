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
    ];

    /**
     * Relation vers l'acheteur.
     */
    public function buyer(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'buyer_id', 'user_id');
    }

    /**
     * Relation vers le vendeur.
     */
    public function seller(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'seller_id', 'user_id');
    }

    /**
     * Relation vers le Listing.
     */
    public function listing(): BelongsTo
    {
        return $this->belongsTo(Listing::class, 'listing_id', 'listing_id');
    }

    /**
     * Relation vers l'Escrow.
     */
    public function escrow(): HasOne
    {
        return $this->hasOne(Escrow::class, 'transaction_id', 'transaction_id');
    }

    /**
     * Relation vers les Payments.
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class, 'transaction_id', 'transaction_id');
    }
}
