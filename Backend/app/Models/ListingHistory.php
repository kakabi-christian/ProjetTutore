<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ListingHistory extends Model
{
    use HasFactory;

    protected $table = 'listing_histories';

    protected $primaryKey = 'listing_history_id';

    protected $fillable = [
        'listing_id',
        'listing_status_id',
        'date',
    ];

    protected $casts = [
        'date' => 'datetime',
    ];

    /**
     * Relation vers le Listing.
     */
    public function listing(): BelongsTo
    {
        return $this->belongsTo(Listing::class, 'listing_id', 'listing_id');
    }

    /**
     * Relation vers le statut du listing.
     */
    public function listingStatus(): BelongsTo
    {
        return $this->belongsTo(ListingStatus::class, 'listing_status_id', 'listing_status_id');
    }
}
