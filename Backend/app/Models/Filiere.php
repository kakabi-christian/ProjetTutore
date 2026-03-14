<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;  

class Filiere extends Model
{
    use HasFactory;
    protected $table = 'filieres';

    protected $primaryKey = 'code_filiere';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'code_filiere',
        'label_filiere',
        'desc_filiere',
    ];

    public $timestamps = true;
}
