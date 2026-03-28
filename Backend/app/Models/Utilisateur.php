<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
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
        'type',
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
            'user_roles',
            'user_id',
            'role_id'
        );
    }

    public function kyc(): HasOne
    {
        return $this->hasOne(Kyc::class, 'user_id', 'user_id');
    }

    public function listings(): HasMany
    {
        return $this->hasMany(Listing::class, 'user_id', 'user_id');
    }

    public function buyerTransactions(): HasMany
    {
        return $this->hasMany(Transaction::class, 'buyer_id', 'user_id');
    }

    public function sellerTransactions(): HasMany
    {
        return $this->hasMany(Transaction::class, 'seller_id', 'user_id');
    }

    public function reviewsGiven(): HasMany
    {
        return $this->hasMany(Review::class, 'reviewer_id', 'user_id');
    }

    public function reviewsReceived(): HasMany
    {
        return $this->hasMany(Review::class, 'reviewed_id', 'user_id');
    }

    public function disputes(): HasMany
    {
        return $this->hasMany(Dispute::class, 'user_id', 'user_id');
    }

    public function moderatedDisputes(): HasMany
    {
        return $this->hasMany(Dispute::class, 'moderator_id', 'user_id');
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class, 'user_id', 'user_id');
    }

    public function methodPayments(): HasMany
    {
        return $this->hasMany(MethodPayment::class, 'user_id', 'user_id');
    }

    public function feedbacks(): HasMany
    {
        return $this->hasMany(Feedback::class, 'user_id', 'user_id');
    }

    public function hasRole($role)
    {
        return $this->roles()->where('name', $role)->exists();
    }

    public function hasPermission($permission)
    {
        return $this->roles()->whereHas('permissions', function ($query) use ($permission) {
            $query->where('name', $permission);
        })->exists();
    }
}
