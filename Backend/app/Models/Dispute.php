<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Dispute extends Model
{
    use HasFactory;

    protected $table = 'disputes';

    protected $primaryKey = 'dispute_id';

    protected $fillable = [
        'user_id',
        'moderator_id',
        'reason',
        'description',
        'status',
    ];

    /**
     * Relation vers l'Utilisateur (qui a ouvert le dispute).
     */
    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'user_id', 'user_id');
    }

    /**
     * Relation vers le Modérateur (qui résout le dispute).
     */
    public function moderateur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'moderator_id', 'user_id');
    }
}
