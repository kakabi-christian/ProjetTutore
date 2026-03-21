<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Utilisateur extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'utilisateurs';

    protected $primaryKey = 'user_id';

    public $incrementing = true;

    protected $fillable = [
        'lastname',
        'firstname',
        'email',
        'type',        // Ajouté ici
        'password',
        'telephone',
        'country',
        'lastlogin',
        'isactive',
        'isverified',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'lastlogin' => 'datetime',
        'isactive' => 'boolean',
        'isverified' => 'boolean',
        'password' => 'hashed',
    ];

    /**
     * Méthode utilitaire pour vérifier si l'utilisateur est admin
     */
    public function isAdmin(): bool
    {
        return $this->type === 'admin';
    }

    public function roles()
    {
        return $this->belongsToMany(
            Role::class,
            'user_roles', // Nom de ta table pivot
            'user_id',   // Clé étrangère dans la pivot vers 'utilisateurs'
            'role_id'    // Clé étrangère dans la pivot vers 'roles'
        );
    }
}
