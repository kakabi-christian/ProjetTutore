<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;


/**
 * @OA\Schema(
 *     schema="Role",
 *     type="object",
 *     @OA\Property(property="role_id", type="integer", example=1),
 *     @OA\Property(property="name", type="string", example="admin"),
 *     @OA\Property(property="description", type="string", example="Administrateur du système"),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time")
 * )
 */
class Role extends Model
{
    use HasFactory;

    /**
     * Le nom de la table associée au modèle.
     */
    protected $table = 'roles';

    /**
     * La clé primaire associée à la table.
     */
    protected $primaryKey = 'role_id';

    /**
     * Les attributs qui peuvent être assignés en masse.
     */
    protected $fillable = [
        'name',
        'description',
    ];

    /**
     * Relation Many-to-Many avec les Utilisateurs.
     * On passe par la table pivot 'userRoles'.
     */
    public function utilisateurs(): BelongsToMany
    {
        return $this->belongsToMany(
            Utilisateur::class,
            'user_roles',    // Table pivot
            'role_id',      // Clé étrangère dans la pivot vers 'roles'
            'user_id'       // Clé étrangère dans la pivot vers 'utilisateurs'
        );
    }

    /**
     * Relation Many-to-Many avec les Permissions.
     * On passe par la table pivot 'role_permissions'.
     */
    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(
            Permission::class,
            'role_permissions', // Table pivot
            'role_id',          // Clé étrangère vers 'roles'
            'permission_id'     // Clé étrangère vers 'permissions'
        );
    }
}
