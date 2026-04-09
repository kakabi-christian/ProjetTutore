<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UtilisateurRequest extends FormRequest
{
    /**
     * Détermine si l'utilisateur est autorisé à faire cette requête.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Obtenez les règles de validation qui s'appliquent à la requête.
     */
    public function rules(): array
    {
        /** * On récupère l'ID de l'utilisateur. 
         * Si c'est une mise à jour, l'ID permettra d'ignorer ses propres données.
         * Si c'est une création (visiteur), $userId sera null.
         */
        $userId = $this->user() ? $this->user()->user_id : null;

        return [
            'lastname' => 'required|string|max:100',
            'firstname' => 'required|string|max:100',

            'email' => [
                'required',
                'email',
                'max:255',
                // On ignore l'ID actuel sur la colonne 'user_id' de la table 'utilisateurs'
                Rule::unique('utilisateurs', 'email')->ignore($userId, 'user_id'),
            ],

            'telephone' => [
                'required',
                'string',
                Rule::unique('utilisateurs', 'telephone')->ignore($userId, 'user_id'),
            ],

            // Requis en création (POST), optionnel en mise à jour (PUT/PATCH)
            'password' => $this->isMethod('post') ? 'required|string|min:8' : 'nullable|string|min:8',

            'type' => 'nullable|in:user,admin',
            'country' => 'required|string',
            'country_code' => 'nullable|string|max:5',
            'isactive' => 'nullable|boolean',
        ];
    }

    /**
     * Personnalisation des messages d'erreur.
     */
    public function messages(): array
    {
        return [
            'lastname.required' => 'Le nom de famille est obligatoire.',
            'firstname.required' => 'Le prénom est obligatoire.',
            'email.required' => 'L\'adresse email est requise.',
            'email.email' => 'Veuillez entrer une adresse email valide.',
            'email.unique' => 'Cette adresse email est déjà utilisée par un autre compte.',
            'telephone.required' => 'Le numéro de téléphone est obligatoire.',
            'telephone.unique' => 'Ce numéro de téléphone est déjà enregistré.',
            'password.required' => 'Le mot de passe est obligatoire.',
            'password.min' => 'Le mot de passe doit contenir au moins 8 caractères.',
            'country.required' => 'Le pays de résidence est obligatoire.',
        ];
    }
}