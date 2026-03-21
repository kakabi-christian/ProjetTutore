<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RolePermission extends Model
{
    use HasFactory;

    
    protected $table = 'user_permissions';

    /**
     * La clé primaire associée à la table.
     */
    protected $primaryKey = 'user_permission_id';

    /**
     * Indique si l'ID est auto-incrémenté.
     */
    public $incrementing = true;

    /**
     * Les attributs qui peuvent être assignés en masse.
     */
    protected $fillable = [
        'role_id',
        'permission_id',
    ];

    /**
     * Relation vers le Rôle.
     */
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'role_id', 'role_id');
    }

    /**
     * Relation vers la Permission.
     */
    public function permission(): BelongsTo
    {
        return $this->belongsTo(Permission::class, 'permission_id', 'permission_id');
    }
}