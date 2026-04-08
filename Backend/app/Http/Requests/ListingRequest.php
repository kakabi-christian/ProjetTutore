<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ListingRequest extends FormRequest
{
    public function authorize(): bool
    {
        // L'autorisation est gérée par Sanctum, on laisse à true ici
        return true;
    }

    /**
     * Règles de validation
     */
    public function rules(): array
    {
        return [
            // ✅ Validation du compte de réception
            'method_payment_id' => [
                'required',
                'integer',
                // On vérifie que l'ID existe dans la table ET appartient à l'utilisateur connecté
                Rule::exists('method_payments', 'method_payment_id')->where(function ($query) {
                    return $query->where('user_id', $this->user()->user_id);
                }),
            ],

            // Devises
            'currency_from' => 'required|string|size:3',
            'currency_to' => 'required|string|size:3|different:currency_from',

            // Montants
            'amount_available' => 'required|numeric|min:0.01',
            'min_amount' => 'nullable|numeric|min:0|lte:amount_available',

            // Taux (Le taux officiel sera récupéré côté Controller via API)
            'user_rate' => 'required|numeric|gt:0',

            // Design & Info
            'visual_theme' => 'nullable|string|max:50',
            'description' => 'nullable|string|max:500',
        ];
    }

    /**
     * Messages personnalisés pour ton front React (très important pour l'UX)
     */
    public function messages(): array
    {
        return [
            'method_payment_id.required' => 'Veuillez sélectionner un compte pour recevoir vos fonds.',
            'method_payment_id.exists' => 'Le compte de paiement sélectionné est invalide ou ne vous appartient pas.',
            'currency_from.size' => 'Le code devise doit comporter exactement 3 lettres.',
            'currency_to.different' => 'La devise de destination doit être différente de la source.',
            'amount_available.required' => 'Le montant total est obligatoire.',
            'min_amount.lte' => 'Le minimum par transaction doit être inférieur ou égal au total.',
            'user_rate.required' => 'Vous devez définir votre propre taux de change.',
        ];
    }

    /**
     * Nettoyage des données avant la validation
     */
    protected function prepareForValidation()
    {
        $this->merge([
            'currency_from' => strtoupper(trim($this->currency_from)),
            'currency_to' => strtoupper(trim($this->currency_to)),
        ]);
    }
}