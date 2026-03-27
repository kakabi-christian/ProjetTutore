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
            'name' => $prefix . '|string|max:255|unique:type_documents,name,' . $id . ',type_document_id',
            'description' => $prefix . '|string|max:255',
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
            'description.required' => 'La description est obligatoire.',
            'description.max' => 'La description ne peut pas dépasser 255 caractères.',
        ];
    }
}
