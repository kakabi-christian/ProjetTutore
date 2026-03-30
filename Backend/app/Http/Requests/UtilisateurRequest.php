<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UtilisateurRequest extends FormRequest
{
    /**
     * Détermine si l'utilisateur est autorisé à faire cette requête.
     */
    public function authorize(): bool
    {
        // À modifier selon ta logique (ex: return auth()->user()->isAdmin();)
        return true;
    }

    /**
     * Obtenez les règles de validation qui s'appliquent à la requête.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'lastname' => 'required|string|max:100',
            'firstname' => 'required|string|max:100',
            'email' => 'required|email|unique:utilisateurs,email,'.$this->user_id.',user_id',
            'telephone' => 'required|string|unique:utilisateurs,telephone,'.$this->user_id.',user_id',
            'password' => $this->isMethod('post') ? 'required|string|min:8' : 'nullable|string|min:8',
            'type' => 'required|in:user,admin',
            'country' => 'required|string',
            'isactive' => 'boolean',
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
            'password.required' => 'Le mot de passe est obligatoire pour un nouvel utilisateur.',
            'password.min' => 'Le mot de passe doit contenir au moins 8 caractères.',
            'type.in' => 'Le type d\'utilisateur doit être "user" ou "admin".',
            'country.required' => 'Le pays de résidence est obligatoire.',
        ];
    }
}
