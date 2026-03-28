<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MethodPayment extends Model
{
    use HasFactory;

    protected $table = 'method_payments';

    protected $primaryKey = 'method_payment_id';

    protected $fillable = [
        'type',
        'provider',
        'account_number',
        'bank_code',
        'is_default',
        'is_verified',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'is_verified' => 'boolean',
    ];

    /**
     * Relation vers les Payments utilisant cette méthode.
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class, 'method_payment_id', 'method_payment_id');
    }
}
