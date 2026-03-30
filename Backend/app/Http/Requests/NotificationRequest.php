<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class NotificationRequest extends FormRequest
{
    /**
     * Détermine si l'utilisateur est autorisé à faire cette requête.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Obtenir les règles de validation qui s'appliquent à la requête.
     */
    public function rules(): array
    {
        return [
            // user_id est requis uniquement si ce n'est PAS un broadcast
            'user_id' => 'required_if:is_broadcast,false,0|nullable|exists:utilisateurs,user_id',
            'is_broadcast' => 'boolean',
            'type' => 'required|integer|in:1,2,3,4', // Optionnel : valide les types existants
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'is_read' => 'boolean',
        ];
    }

    /**
     * Obtenir les messages d'erreur personnalisés.
     */
    public function messages(): array
    {
        return [
            'user_id.required_if' => 'Le destinataire est obligatoire pour une notification ciblée.',
            'user_id.exists' => 'Cet utilisateur n\'existe pas dans notre base.',
            'type.required' => 'Le type de notification est requis.',
            'type.in' => 'Le type de notification est invalide.',
            'title.required' => 'Le titre ne peut pas être vide.',
            'message.required' => 'Le contenu du message est obligatoire.',
        ];
    }
}
