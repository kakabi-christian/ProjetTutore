<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PaymentMethodRequest extends FormRequest
{
    /**
     * Détermine si l'utilisateur est autorisé à faire cette requête.
     */
    public function authorize(): bool
    {
        // On active l'autorisation (généralement gérée par le middleware auth:sanctum)
        return true;
    }

    /**
     * Règles de validation basées sur ton modèle MethodPayment.
     */
    public function rules(): array
    {
        return [
            'type' => 'required|string|in:MOBILE_MONEY,BANK,CARD',
            'provider' => 'required|string|max:100', // ex: MTN, Orange, UBA
            'currency' => 'required|string|size:3',   // ex: XAF, NGN, EUR
            'account_number' => 'required|string|min:5|max:255',
            'account_name' => 'required|string|max:255',
            'bank_code' => 'nullable|string|max:50',  // Code banque Flutterwave
            'is_default' => 'boolean',
        ];
    }

    /**
     * Messages d'erreurs personnalisés pour le Dashboard.
     */
    public function messages(): array
    {
        return [
            'type.in' => 'Le type de paiement doit être MOBILE_MONEY, BANK ou CARD.',
            'currency.size' => 'La devise doit comporter exactement 3 caractères (ex: XAF).',
            'account_number.required' => 'Le numéro de compte ou de téléphone est obligatoire.',
            'account_name.required' => 'Le nom du titulaire du compte est obligatoire.',
            'provider.required' => 'Veuillez sélectionner un fournisseur (opérateur ou banque).',
        ];
    }
}
