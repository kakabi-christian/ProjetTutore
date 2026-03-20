<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Niveau extends Model
{
    use HasFactory;
    protected $table = 'niveaux';

    protected $primaryKey = 'code_niveau';

    public $incrementing = true;

    protected $keyType = 'int';

    protected $fillable = [
        'label_niveau',
        'desc_niveau',
        'code_filiere',
    ];

    public $timestamps = true;

/*************  ✨ Windsurf Command ⭐  *************/
    /**
     * Relation avec le modèle Filiere
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
/*******  ebe195f0-31db-4fda-b680-46100519c5c5  *******/
    public function filiere()
    {
        return $this->belongsTo(Filiere::class, 'code_filiere', 'code_filiere');
    }

    public function ues()
    {
        return $this->hasMany(Ue::class, 'code_niveau', 'code_niveau');
    }
}
