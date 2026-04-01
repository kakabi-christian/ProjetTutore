<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class StatisticsRequest extends FormRequest
{
    /**
     * Détermine si l'utilisateur est autorisé à faire cette requête.
     * Pour ExchaPay, on vérifie si l'utilisateur est connecté.
     */
    public function authorize(): bool
    {
        // On autorise si l'utilisateur est authentifié
        return auth()->check();
    }

    /**
     * Règles de validation pour filtrer les statistiques.
     */
    public function rules(): array
    {
        return [
            'period'     => 'nullable|string|in:day,week,month,year,all',
            'start_date' => 'nullable|date|before_or_equal:end_date',
            'end_date'   => 'nullable|date|after_or_equal:start_date',
            'currency'   => 'nullable|string|max:10', // Pour filtrer par devise (ex: XAF, EUR)
        ];
    }

    /**
     * Messages d'erreur personnalisés.
     */
    public function messages(): array
    {
        return [
            'period.in'             => "La période sélectionnée n'est pas valide (choisissez : day, week, month, year, all).",
            'start_date.date'       => "La date de début doit être une date valide.",
            'start_date.before_or_equal' => "La date de début ne peut pas être après la date de fin.",
            'end_date.date'         => "La date de fin doit être une date valide.",
            'end_date.after_or_equal'  => "La date de fin ne peut pas être avant la date de début.",
            'currency.max'          => "Le code de la devise est trop long.",
        ];
    }

    /**
     * Optionnel : Gérer l'échec de validation pour renvoyer du JSON propre (utile pour ton frontend React)
     */
    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            'errors'  => $validator->errors()
        ], 422));
    }
}