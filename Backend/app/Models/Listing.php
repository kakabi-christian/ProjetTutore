<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Listing extends Model
{
    use HasFactory;

    protected $table = 'listings';

    protected $primaryKey = 'listing_id';

    protected $fillable = [
        'user_id',
        'method_payment_id', // ✅ Ajouté pour lier le compte de réception
        'currency_from',
        'currency_to',
        'amount_available',
        'min_amount',
        'official_rate',
        'user_rate',
        'visual_theme',
        'description',
    ];

    /**
     * Ajoute automatiquement cet attribut au JSON envoyé au frontend.
     */
    protected $appends = ['discount_percentage'];

    protected $casts = [
        'amount_available' => 'decimal:2',
        'min_amount' => 'decimal:2',
        'official_rate' => 'float',
        'user_rate' => 'float',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * 📈 Accesseur pour calculer la réduction.
     * Utile pour afficher "-5%" sur le badge de l'annonce au frontend.
     */
    public function getDiscountPercentageAttribute()
    {
        $official = (float) $this->official_rate;
        $user = (float) $this->user_rate;

        if ($official <= 0) {
            return 0;
        }

        // Formule : ((Officiel - Utilisateur) / Officiel) * 100
        $diff = $official - $user;
        $percentage = ($diff / $official) * 100;

        return round($percentage, 2);
    }

    // --- RELATIONS ---

    /**
     * L'utilisateur qui a publié l'annonce.
     */
    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'user_id', 'user_id');
    }

    /**
     * ✅ Le compte bancaire ou mobile money choisi pour recevoir les fonds de cette annonce.
     */
    public function paymentMethod(): BelongsTo
    {
        return $this->belongsTo(MethodPayment::class, 'method_payment_id', 'method_payment_id');
    }

    /**
     * Historique des changements de statut (publiée, en attente, terminée).
     */
    public function histories(): HasMany
    {
        return $this->hasMany(ListingHistory::class, 'listing_id', 'listing_id');
    }

    /**
     * Récupère le dernier statut de l'annonce via l'historique.
     */
    public function currentStatus()
    {
        return $this->histories()->with('listingStatus')->latest('listing_history_id')->first();
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class, 'listing_id', 'listing_id');
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class, 'listing_id', 'listing_id');
    }
}