<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Review extends Model
{
    use HasFactory;

    protected $table = 'reviews';

    protected $primaryKey = 'review_id';

    protected $fillable = [
        'reviewer_id',
        'listing_id',
        'rating',
        'comment',
    ];

    /**
     * Relation vers l'utilisateur qui laisse l'avis.
     */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'reviewer_id', 'user_id');
    }

    /**
     * Relation vers le listing.
     */
    public function listing(): BelongsTo
    {
        return $this->belongsTo(Listing::class, 'listing_id', 'listing_id');
    }
}
