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
        // On récupère l'ID de l'utilisateur connecté pour l'exclure de la vérification unique
        $userId = auth()->id();

        return [
            'lastname' => 'required|string|max:100',
            'firstname' => 'required|string|max:100',

            // ✅ Correction Unicité Email : ignore l'ID de l'utilisateur actuel
            'email' => [
                'required',
                'email',
                Rule::unique('utilisateurs', 'email')->ignore($userId, 'user_id'),
            ],

            // ✅ Correction Unicité Téléphone : ignore l'ID de l'utilisateur actuel
            'telephone' => [
                'required',
                'string',
                Rule::unique('utilisateurs', 'telephone')->ignore($userId, 'user_id'),
            ],

            // Le mot de passe est requis seulement à la création (POST)
            'password' => $this->isMethod('post') ? 'required|string|min:8' : 'nullable|string|min:8',

            // Le type et l'état sont souvent gérés par l'admin, on les met en nullable pour le profil simple
            'type' => 'nullable|in:user,admin',
            'country' => 'required|string',
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
