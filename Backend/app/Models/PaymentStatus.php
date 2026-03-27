<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PaymentStatus extends Model
{
    use HasFactory;

    protected $table = 'payment_statuses';

    protected $primaryKey = 'payment_status_id';

    protected $fillable = [
        'title',
    ];

    /**
     * Relation vers les Payments ayant ce statut.
     */
    public function payments(): BelongsToMany
    {
        return $this->belongsToMany(
            Payment::class,
            'payment_histories',
            'payment_status_id',
            'payment_id'
        );
    }
}
