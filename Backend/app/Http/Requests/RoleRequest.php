<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RoleRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // On autorise la requête (à restreindre plus tard si nécessaire)
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        // On récupère l'ID du rôle depuis la route (si on est en mode UPDATE)
        // Laravel récupère automatiquement l'ID si ta route est /roles/{role}
        $roleId = $this->route('role');

        return [
            'name' => [
                'required',
                'string',
                'max:50',
                // Unicité du nom, en ignorant l'ID actuel lors de la modification
                Rule::unique('roles', 'name')->ignore($roleId, 'role_id'),
            ],
            'description' => 'nullable|string|max:255',
        ];
    }

    /**
     * Personnalisation des messages d'erreur.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Le nom du rôle est obligatoire.',
            'name.string' => 'Le nom doit être une chaîne de caractères.',
            'name.max' => 'Le nom du rôle ne doit pas dépasser 50 caractères.',
            'name.unique' => 'Ce nom de rôle existe déjà.',
            'description.max' => 'La description ne doit pas dépasser 255 caractères.',
        ];
    }
}
