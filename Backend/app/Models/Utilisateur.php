<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * @OA\Schema(
 * schema="Utilisateur",
 * type="object",
 *
 * @OA\Property(property="user_id", type="integer", example=1),
 * @OA\Property(property="lastname", type="string", example="Dupont"),
 * @OA\Property(property="firstname", type="string", example="Jean"),
 * @OA\Property(property="email", type="string", format="email", example="jean.dupont@example.com"),
 * @OA\Property(property="telephone", type="string", example="+237658788448"),
 * @OA\Property(property="country", type="string", example="Cameroun"),
 * @OA\Property(property="country_code", type="string", example="CM"),
 * @OA\Property(property="type", type="string", enum={"admin", "user"}, example="user"),
 * @OA\Property(property="isactive", type="boolean", example=true),
 * @OA\Property(property="isverified", type="boolean", example=true),
 * @OA\Property(property="created_at", type="string", format="date-time"),
 * @OA\Property(property="updated_at", type="string", format="date-time")
 * )
 */
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
        'country_code', // ✅ Ajouté pour le mapping dynamique (ex: CM, NG)
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
