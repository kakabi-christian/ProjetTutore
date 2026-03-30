<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UtilisateurRequest;
use App\Models\Utilisateur;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class UtilisateurController extends Controller
{
    /**
     * Récupère les informations du profil de l'utilisateur connecté.
     */
    public function profile(): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'user' => Auth::user(),
        ], 200);
    }

    /**
     * Met à jour les informations de profil de l'utilisateur.
     */
    /**
     * Met à jour les informations de profil de l'utilisateur connecté.
     */
    public function updateProfile(UtilisateurRequest $request): JsonResponse
    {
        /** @var Utilisateur $user */
        $user = Auth::user();

        // 🛡️ Sécurité : On récupère uniquement les données autorisées pour un profil
        // Cela évite qu'un utilisateur change son 'type' en 'admin' ou modifie son 'password' ici.
        $data = $request->safe()->only([
            'lastname',
            'firstname',
            'email',
            'telephone',
            'country',
        ]);

        // Mise à jour en base de données
        $user->update($data);

        // On rafraîchit le modèle pour renvoyer les données exactes de la DB
        $user->refresh();

        return response()->json([
            'status' => 'success',
            'message' => 'Profil mis à jour avec succès.',
            'user' => $user,
        ], 200);
    }

    /**
     * Change le mot de passe de l'utilisateur connecté.
     */
    public function updatePassword(Request $request): JsonResponse
    {
        $request->validate([
            'old_password' => 'required',
            'new_password' => 'required|string|min:8|confirmed',
        ], [
            'new_password.confirmed' => 'La confirmation du nouveau mot de passe ne correspond pas.',
            'new_password.min' => 'Le nouveau mot de passe doit faire au moins 8 caractères.',
        ]);

        /** @var Utilisateur $user */
        $user = Auth::user();

        // 1. Vérifier si l'ancien mot de passe est correct
        if (! Hash::check($request->old_password, $user->password)) {
            return response()->json([
                'status' => 'error',
                'message' => 'L\'ancien mot de passe est incorrect.',
            ], 422);
        }

        // 2. Mettre à jour le mot de passe
        $user->update([
            'password' => Hash::make($request->new_password),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Mot de passe modifié avec succès.',
        ], 200);
    }

    /**
     * Récupère la liste simplifiée des utilisateurs de type 'user' (Admin).
     */
    public function getUsersList(): JsonResponse
    {
        try {
            $users = Utilisateur::select('user_id', 'firstname', 'lastname', 'email')
                ->where('type', 'user')
                ->where('isactive', true)
                ->orderBy('lastname', 'asc')
                ->get();

            return response()->json($users, 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la récupération des utilisateurs',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    // Tu peux garder les méthodes index, store, etc. si tu prévois une gestion CRUD Admin.
}
