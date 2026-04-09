<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class StatisticsRequest extends FormRequest
{
    /**
     * Détermine si l'utilisateur est autorisé à faire cette requête.
     */
    public function authorize(): bool
    {
        // Retourne true si l'utilisateur est connecté, false sinon
        return $this->user() !== null;
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
            'currency'   => 'nullable|string|max:10',
        ];
    }

    /**
     * Messages d'erreur personnalisés.
     */
    public function messages(): array
    {
        return [
            'period.in'                  => "La période sélectionnée n'est pas valide (day, week, month, year, all).",
            'start_date.date'            => 'La date de début doit être une date valide.',
            'start_date.before_or_equal' => 'La date de début ne peut pas être après la date de fin.',
            'end_date.date'              => 'La date de fin doit être une date valide.',
            'end_date.after_or_equal'    => 'La date de fin ne peut pas être avant la date de début.',
            'currency.max'               => 'Le code de la devise est trop long.',
        ];
    }

    /**
     * Gère l'échec de validation pour renvoyer du JSON (Format API)
     */
    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => 'Erreur de validation des filtres',
            'errors'  => $validator->errors(),
        ], 422));
    }
}