<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Factories\HasFactory; // ✅ ajouter ceci

class Personnel extends Authenticatable
{
    use HasApiTokens, HasFactory; // ✅ ici aussi tout en majuscule

    protected $table = 'personnels';

    protected $primaryKey = 'id'; // ⚡ important pour UUID
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'code_pers',
        'nom_pers',
        'sexe_pers',
        'phone_pers',
        'login_pers',
        'pwd_pers',
        'type_pers',
    ];

    public $timestamps = true;

    protected static function booted()
    {
        static::creating(function ($model) {
            if (!$model->getKey()) {
                $model->{$model->getKeyName()} = (string) Str::uuid();
            }
        });
    }
}
