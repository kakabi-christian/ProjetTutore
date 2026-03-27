<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TypeDocument extends Model
{
    use HasFactory;

    protected $table = 'type_documents';

    protected $primaryKey = 'type_document_id';

    protected $fillable = [
        'name',
        'description',
    ];

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class, 'type_document_id', 'type_document_id');
    }
}
