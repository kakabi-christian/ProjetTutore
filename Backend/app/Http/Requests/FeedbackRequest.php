<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class FeedbackRequest extends FormRequest
{
    /**
     * Détermine si l'utilisateur est autorisé à faire cette requête.
     */
    public function authorize(): bool
    {
        // On autorise la requête (la protection se fera via le middleware sanctum dans les routes)
        return true;
    }

    /**
     * Règles de validation pour le feedback.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // L'user_id vient généralement de l'utilisateur connecté,
            // mais on le valide s'il est envoyé dans le corps de la requête.
            'user_id' => 'required|exists:utilisateurs,user_id',
            'comment' => 'required|string|min:5|max:1000',
            'note' => 'required|integer|min:1|max:5',
        ];
    }

    /**
     * Messages d'erreur personnalisés.
     */
    public function messages(): array
    {
        return [
            'user_id.required' => 'L\'identifiant de l\'utilisateur est manquant.',
            'user_id.exists' => 'L\'utilisateur spécifié n\'existe pas.',
            'comment.required' => 'Le commentaire est obligatoire pour nous aider à nous améliorer.',
            'comment.min' => 'Votre commentaire doit faire au moins 5 caractères.',
            'comment.max' => 'Votre commentaire est trop long (1000 caractères maximum).',
            'note.required' => 'Veuillez attribuer une note.',
            'note.integer' => 'La note doit être un nombre entier.',
            'note.min' => 'La note minimale est de 1 étoile.',
            'note.max' => 'La note maximale est de 5 étoiles.',
        ];
    }
}
