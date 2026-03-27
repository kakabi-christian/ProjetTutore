<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Kyc extends Model
{
    use HasFactory;

    protected $table = 'kycs';

    protected $primaryKey = 'kyc_id';

    protected $fillable = [
        'user_id',
        'current_level',
        'status',
        'completed_at',
    ];

    protected $casts = [
        'completed_at' => 'datetime',
    ];

    /**
     * Relation vers l'Utilisateur.
     */
    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'user_id', 'user_id');
    }

    /**
     * Relation vers les Documents.
     */
    public function documents(): HasMany
    {
        return $this->hasMany(Document::class, 'kyc_id', 'kyc_id');
    }
}
