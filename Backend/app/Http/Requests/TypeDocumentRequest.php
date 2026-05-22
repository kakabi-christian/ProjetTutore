<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TypeDocumentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        $id = $this->route('type_document');
        $prefix = $this->isMethod('post') ? 'required' : 'sometimes|required';

        return [
            'name' => $prefix.'|string|max:255|unique:type_documents,name,'.$id.',type_document_id',
            
            // 📝 Ajout de la validation du fichier ici (PDF et images autorisés)
            'file' => $prefix.'|file|mimes:pdf,jpg,jpeg,png|max:10240', // Max 10 Mo
        ];
    }

    /**
     * Messages d'erreur personnalisés.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Le nom du type de document est obligatoire.',
            'name.unique' => 'Ce nom de type de document existe déjà.',
            'name.max' => 'Le nom ne peut pas dépasser 255 caractères.',
            
            // 📝 Messages d'erreur personnalisés pour le fichier
            'file.required' => 'Le fichier est obligatoire.',
            'file.file' => 'Le fichier chargé n\'est pas valide.',
            'file.mimes' => 'Le fichier doit être au format PDF, JPG, JPEG ou PNG.',
            'file.max' => 'Le fichier ne peut pas dépasser 10 Mo.',
        ];
    }
}