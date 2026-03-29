<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class KycRequest extends FormRequest
{
    /**
     * Détermine si l'utilisateur est autorisé à faire cette requête.
     */
    public function authorize(): bool
    {
        // On active l'autorisation pour permettre la validation
        return true;
    }

    /**
     * Règles de validation pour le dossier KYC.
     */
    public function rules(): array
    {
        return [
            'country_of_issue' => 'required|string|max:50',
            'documents' => 'required|array|min:1',
            'documents.*.file' => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'documents.*.type_document_id' => 'required|exists:type_documents,type_document_id',
        ];
    }

    /**
     * Messages d'erreur personnalisés.
     */
    public function messages(): array
    {
        return [
            'country_of_issue.required' => 'Le pays d\'émission est obligatoire.',
            'documents.required' => 'Vous devez fournir au moins un document.',
            'documents.*.file.required' => 'Le fichier est obligatoire pour chaque document.',
            'documents.*.file.mimes' => 'Les formats acceptés sont : PDF, JPG, JPEG, PNG.',
            'documents.*.file.max' => 'La taille d\'un fichier ne doit pas dépasser 5 Mo.',
            'documents.*.type_document_id.required' => 'Le type de document est obligatoire.',
            'documents.*.type_document_id.exists' => 'Le type de document sélectionné est invalide.',
        ];
    }
}   