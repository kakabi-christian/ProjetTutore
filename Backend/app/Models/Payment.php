<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Payment extends Model
{
    use HasFactory;

    protected $table = 'payments';

    protected $primaryKey = 'payment_id';

    protected $fillable = [
        'user_id',
        'transaction_id',
        'method_payment_id',
        'amount',
        'currency',
        // --- Flutterwave ---
        'status',          // PENDING | SUCCESS | FAILED | REFUNDED
        'provider',        // Ex: MTN, ORANGE, VISA (vient de la réponse FLW)
        'flw_payment_id',  // L'ID unique côté Flutterwave
        'paid_at',         // Timestamp de confirmation
    ];

    protected $casts = [
        'amount'   => 'float',
        'paid_at'  => 'datetime',
    ];

    // -------------------------------------------------------
    // Constantes de statut
    // -------------------------------------------------------
    const STATUS_PENDING  = 'PENDING';
    const STATUS_SUCCESS  = 'SUCCESS';
    const STATUS_FAILED   = 'FAILED';
    const STATUS_REFUNDED = 'REFUNDED';

    // -------------------------------------------------------
    // Relations
    // -------------------------------------------------------

    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'user_id', 'user_id');
    }

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class, 'transaction_id', 'transaction_id');
    }

    public function methodPayment(): BelongsTo
    {
        return $this->belongsTo(MethodPayment::class, 'method_payment_id', 'method_payment_id');
    }

    public function histories(): HasMany
    {
        return $this->hasMany(PaymentHistory::class, 'payment_id', 'payment_id');
    }

    // -------------------------------------------------------
    // Helpers
    // -------------------------------------------------------

    public function isSuccessful(): bool
    {
        return $this->status === self::STATUS_SUCCESS;
    }
}