<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;  

class Ec extends Model
{
    use HasFactory;

    protected $table = 'ecs';

    protected $primaryKey = 'code_ec';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'code_ec',
        'label_ec',
        'desc_ec',
        'nbh_ec',
        'nbc_ec',
        'code_ue',
        'image_ec', // ✅ ajout du champ image
    ];

    public $timestamps = true;

    /**
     * Relation avec UE
     */
    public function ue()
    {
        return $this->belongsTo(Ue::class, 'code_ue', 'code_ue');
    }

    /**
     * Relation avec Enseigne
     */
    public function enseignes()
    {
        return $this->hasMany(Enseigne::class, 'code_ec', 'code_ec');
    }

    /**
     * Relation avec Programmation
     */
    public function programmations()
    {
        return $this->hasMany(Programmation::class, 'code_ec', 'code_ec');
    }

    /**
     * ✅ Accesseur pour retourner l'URL complète de l'image
     */
    public function getImageEcUrlAttribute()
    {
        return $this->image_ec
            ? asset('storage/' . $this->image_ec)
            : null;
    }
}
