<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AuthRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Obligatoire pour permettre l'accès aux routes d'auth
    }

    public function rules(): array
    {
        // 1. Validation LOGIN
        if ($this->is('api/login')) {
            return [
                'email'    => 'required|email|exists:utilisateurs,email',
                'password' => 'required|string',
            ];
        }

        // 2. Validation REGISTER
        if ($this->is('api/register')) {
            return [
                'lastname'  => 'required|string|max:100',
                'firstname' => 'required|string|max:100',
                'email'     => 'required|email|unique:utilisateurs,email',
                'password'  => 'required|string|min:8|confirmed',
                'telephone' => 'required|string|unique:utilisateurs,telephone',
                'country'   => 'required|string', // Mis à jour ici
            ];
        }

        // 3. Validation VERIFY OTP
        if ($this->is('api/verify-otp')) {
            return [
                'email' => 'required|email|exists:utilisateurs,email',
                'otp'   => 'required|string|size:6', // Supposant un code à 6 chiffres
            ];
        }

        // 4. Validation FORGOT PASSWORD (Envoi du mail)
        if ($this->is('api/forgot-password')) {
            return [
                'email' => 'required|email|exists:utilisateurs,email',
            ];
        }

        // 5. Validation RESET PASSWORD (Nouveau mot de passe)
        if ($this->is('api/reset-password')) {
            return [
                'email'    => 'required|email|exists:utilisateurs,email',
                'otp'      => 'required|string',
                'password' => 'required|string|min:8|confirmed',
            ];
        }

        return [];
    }

    public function messages(): array
    {
        return [
            'email.exists'     => "Aucun compte n'est associé à cette adresse email.",
            'email.unique'     => "Cette adresse email est déjà utilisée.",
            'telephone.unique' => "Ce numéro de téléphone est déjà utilisé.",
            'otp.size'         => "Le code de vérification doit comporter 6 chiffres.",
            'password.confirmed' => "La confirmation du mot de passe ne correspond pas.",
        ];
    }
}