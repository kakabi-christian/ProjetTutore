<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentHistory extends Model
{
    use HasFactory;

    protected $table = 'payment_histories';

    protected $primaryKey = 'payment_history_id';

    protected $fillable = [
        'payment_id',
        'payment_status_id',
        'date',
    ];

    protected $casts = [
        'date' => 'datetime',
    ];

    /**
     * Relation vers le Payment.
     */
    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class, 'payment_id', 'payment_id');
    }

    /**
     * Relation vers le statut du paiement.
     */
    public function paymentStatus(): BelongsTo
    {
        return $this->belongsTo(PaymentStatus::class, 'payment_status_id', 'payment_status_id');
    }
}
