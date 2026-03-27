<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Listing extends Model
{
    use HasFactory;

    protected $table = 'listings';

    protected $primaryKey = 'listing_id';

    protected $fillable = [
        'user_id',
        'currency_from',
        'currency_to',
        'amount_available',
        'exchange_rate',
    ];

    /**
     * Relation vers l'Utilisateur (vendeur).
     */
    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'user_id', 'user_id');
    }

    /**
     * Relation vers les Transactions générées.
     */
    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class, 'listing_id', 'listing_id');
    }

    /**
     * Relation vers l'historique du listing.
     */
    public function histories(): HasMany
    {
        return $this->hasMany(ListingHistory::class, 'listing_id', 'listing_id');
    }

    /**
     * Relation vers les review.
     */
    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class, 'listing_id', 'listing_id');
    }
}
