<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    use HasFactory;

    protected $table = 'notifications';

    protected $primaryKey = 'notification_id';

    // --- CONSTANTES DE TYPE ---
    const TYPE_SUCCESS = 1; // Vert (Ex: KYC validé)

    const TYPE_ERROR = 2; // Rouge (Ex: KYC rejeté)

    const TYPE_INFO = 3; // Bleu (Ex: Message système, maintenance)

    const TYPE_WARNING = 4; // Orange (Ex: Tentative de connexion suspecte)

    protected $fillable = [
        'user_id',
        'is_broadcast', // Ajouté
        'type',
        'title',
        'message',
        'is_read',
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'is_broadcast' => 'boolean', // Ajouté
        'type' => 'integer',
    ];

    /**
     * Relation vers l'Utilisateur.
     */
    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'user_id', 'user_id');
    }

    /**
     * Scope pour récupérer les notifications destinées à un utilisateur précis
     * incluant les messages de diffusion générale (broadcast).
     */
    public function scopeForUser(Builder $query, $userId): Builder
    {
        return $query->where('user_id', $userId)
            ->orWhere('is_broadcast', true);
    }
}
