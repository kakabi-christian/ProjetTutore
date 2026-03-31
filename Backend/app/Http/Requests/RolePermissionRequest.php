<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class RolePermissionRequest extends FormRequest
{
    /**
     * Détermine si l'utilisateur est autorisé à effectuer cette requête.
     */
    public function authorize(): bool
    {
        // On passe à true pour permettre l'accès (à coupler avec tes middlewares plus tard)
        return true;
    }

    /**
     * Règles de validation pour l'assignation des permissions.
     *
     * * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'role_id' => 'required|exists:roles,role_id',
            'permissions' => 'required|array|min:1',
            'permissions.*' => 'exists:permissions,permission_id',
        ];
    }

    /**
     * Messages d'erreur personnalisés.
     */
    public function messages(): array
    {
        return [
            'role_id.required' => 'Le rôle est obligatoire.',
            'role_id.exists' => 'Le rôle sélectionné est invalide.',

            'permissions.required' => 'Vous devez sélectionner au moins une permission.',
            'permissions.array' => 'Le format des permissions est invalide.',
            'permissions.min' => 'Veuillez cocher au moins une permission pour ce rôle.',

            'permissions.*.exists' => 'Une ou plusieurs permissions sélectionnées n\'existent pas dans la base de données.',
        ];
    }
}
