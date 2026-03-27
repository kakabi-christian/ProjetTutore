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
    ];

    /**
     * Relation vers l'Utilisateur.
     */
    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'user_id', 'user_id');
    }

    /**
     * Relation vers la Transaction.
     */
    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class, 'transaction_id', 'transaction_id');
    }

    /**
     * Relation vers la méthode de paiement.
     */
    public function methodPayment(): BelongsTo
    {
        return $this->belongsTo(MethodPayment::class, 'method_payment_id', 'method_payment_id');
    }


    /**
     * Relation vers l'historique des paiements.
     */
    public function histories(): HasMany
    {
        return $this->hasMany(PaymentHistory::class, 'payment_id', 'payment_id');
    }
}
