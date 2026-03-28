<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ListingStatus extends Model
{
    use HasFactory;

    protected $table = 'listing_statuses';

    protected $primaryKey = 'listing_status_id';

    protected $fillable = [
        'title',
    ];

    /**
     * Relation vers les Listings ayant ce statut.
     */
    public function listings(): BelongsToMany
    {
        return $this->belongsToMany(
            Listing::class,
            'listing_histories',
            'listing_status_id',
            'listing_id'
        );
    }
}
