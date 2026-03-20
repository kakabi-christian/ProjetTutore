<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Str;

class Enseigne extends Model
{
    use HasFactory;

    protected $table = 'enseigne';

    protected $primaryKey = 'id';

    public $incrementing = false; // UUID n’est pas auto-incrément
    protected $keyType = 'string';

    protected $fillable = [
        'code_pers',
        'code_ec',
        'date_ens',
    ];

    public $timestamps = true;

    // Générer un UUID avant la création
    protected static function booted()
    {
        static::creating(function ($model) {
            if (!$model->id) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    public function personnel()
    {
        return $this->belongsTo(Personnel::class, 'code_pers', 'code_pers');
    }

    public function ec()
    {
        return $this->belongsTo(Ec::class, 'code_ec', 'code_ec');
    }
}
