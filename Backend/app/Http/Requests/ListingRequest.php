<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ListingRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Autorise si l'utilisateur est authentifié (géré par le middleware sanctum)
        return true;
    }

    /**
     * Règles de validation
     */
    public function rules(): array
    {
        return [
            // On utilise 'uppercase' pour forcer la cohérence en DB
            'currency_from' => 'required|string|size:3',
            'currency_to' => 'required|string|size:3|different:currency_from',

            // Montant total
            'amount_available' => 'required|numeric|min:0.01',

            // Correction : Utilisation de 'lte' (Less Than or Equal) pour comparer avec un autre champ
            'min_amount' => 'nullable|numeric|min:0|lte:amount_available',

            // Taux proposé
            'user_rate' => 'required|numeric|gt:0',

            'visual_theme' => 'nullable|string|max:50',
            'description' => 'nullable|string|max:500',
        ];
    }

    /**
     * Messages personnalisés pour une meilleure UX sur ton front React
     */
    public function messages(): array
    {
        return [
            'currency_from.size' => 'Le code devise doit comporter 3 lettres (ex: USD).',
            'currency_to.different' => 'Les deux devises doivent être différentes.',
            'amount_available.required' => 'Veuillez indiquer le montant total que vous vendez.',
            'amount_available.min' => 'Le montant doit être supérieur à 0.',
            'min_amount.lte' => 'Le minimum par transaction ne peut pas dépasser le total disponible.',
            'user_rate.required' => 'Votre taux est nécessaire pour calculer le profit des acheteurs.',
            'user_rate.gt' => 'Le taux doit être un nombre positif.',
        ];
    }

    /**
     * Pré-traitement avant validation (Optionnel)
     * Utile pour mettre les devises en majuscules automatiquement
     */
    protected function prepareForValidation()
    {
        $this->merge([
            'currency_from' => strtoupper($this->currency_from),
            'currency_to' => strtoupper($this->currency_to),
        ]);
    }
}
