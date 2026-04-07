<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Escrow extends Model
{
    use HasFactory;

    protected $table = 'escrows';

    protected $primaryKey = 'escrow_id';

    protected $fillable = [
        'transaction_id',
        'buyer_amount',
        'seller_amount',
        'locked_at',
        'released_at',
    ];

    protected $casts = [
        'locked_at' => 'datetime',
        'released_at' => 'datetime',
    ];

    /**
     * Relation vers la Transaction.
     */
    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class, 'transaction_id', 'transaction_id');
    }
}
