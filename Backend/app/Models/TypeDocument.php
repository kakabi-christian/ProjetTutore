<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;


/**
 * @OA\Schema(
 *     schema="TypeDocument",
 *     type="object",
 *     @OA\Property(property="type_document_id", type="integer", example=1),
 *     @OA\Property(property="name", type="string", example="Carte d'identité"),
 *     @OA\Property(property="description", type="string", example="Document d'identité"),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time")
 * )
 */
class TypeDocument extends Model
{
    use HasFactory;

    protected $table = 'type_documents';

    protected $primaryKey = 'type_document_id';

    protected $fillable = [
        'name',
        'description',
    ];

    public function documents()
    {
        return $this->hasMany(Document::class, 'type_document_id', 'type_document_id');
    }
}
