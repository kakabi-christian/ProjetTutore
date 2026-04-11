<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MethodPayment extends Model
{
    use HasFactory;

    protected $table = 'method_payments';

    protected $primaryKey = 'method_payment_id';

    protected $fillable = [
        'user_id',
        'type',
        'provider',
        'currency',
        'account_number',
        'account_name',
        'bank_code',
        'is_default',
        'is_verified',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'is_verified' => 'boolean',
        // Chiffrement automatique des données sensibles
        'account_number' => 'encrypted',
        'account_name' => 'encrypted',
    ];

    /**
     * Relation vers l'utilisateur propriétaire de ce mode de paiement.
     */
    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'user_id', 'user_id');
    }

    /**
     * Relation vers les Payments utilisant cette méthode.
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class, 'method_payment_id', 'method_payment_id');
    }
}
