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
        'official_rate' => 'float', // Changé en float pour faciliter les calculs
        'user_rate' => 'float',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * 📈 Accesseur pour calculer la réduction.
     * Sécurisé contre la division par zéro et les taux officiels manquants.
     */
    public function getDiscountPercentageAttribute()
    {
        // On récupère les valeurs brutes du modèle
        $official = (float) $this->official_rate;
        $user = (float) $this->user_rate;

        // Sécurité : si pas de taux officiel, on ne peut pas calculer de réduction
        if ($official <= 0) {
            return 0;
        }

        // Calcul : (Taux Officiel - Taux Utilisateur) / Taux Officiel * 100
        $diff = $official - $user;
        $percentage = ($diff / $official) * 100;

        // On arrondit à 2 décimales pour un affichage propre (ex: 5.25)
        return round($percentage, 2);
    }

    // --- RELATIONS ---

    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'user_id', 'user_id');
    }

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