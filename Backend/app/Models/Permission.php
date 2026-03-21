<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Permission extends Model
{
    use HasFactory;

    protected $table = 'permissions';

    protected $primaryKey = 'permission_id';

    /**
     * Les attributs qui peuvent être assignés en masse.
     */
    protected $fillable = [
        'name',
        'description',
    ];

    /**
     * Relation Many-to-Many avec les Rôles.
     * Cette permission peut appartenir à plusieurs rôles via 'user_permissions'.
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(
            Role::class,
            'user_permissions', // Table pivot
            'permission_id',    // Clé étrangère dans la pivot vers 'permissions'
            'role_id'           // Clé étrangère dans la pivot vers 'roles'
        );
    }
}
