<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PermissionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Autoriser la requête pour le développement
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $permissionId = $this->route('permission'); // Récupère l'ID si on est en mode update

        return [
            'name' => [
                'required',
                'string',
                'max:100',
                // Unique sauf pour la permission actuelle si on modifie
                'unique:permissions,name,' . $permissionId . ',permission_id'
            ],
            'description' => 'nullable|string|max:255',
        ];
    }

    /**
     * Messages personnalisés en français.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Le nom de la permission est obligatoire.',
            'name.string'   => 'Le nom doit être une chaîne de caractères.',
            'name.max'      => 'Le nom ne doit pas dépasser 100 caractères.',
            'name.unique'   => 'Cette permission existe déjà dans le système.',
            
            'description.string' => 'La description doit être un texte.',
            'description.max'    => 'La description ne doit pas dépasser 255 caractères.',
        ];
    }
}