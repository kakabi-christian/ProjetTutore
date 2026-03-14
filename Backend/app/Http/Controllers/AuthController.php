<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\Personnel;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log; // ✅ Ajout de l'import pour les logs

class AuthController extends Controller
{
    public function login(Request $request)
    {
        try {
            // Validation
            $credentials = $request->validate([
                'login_pers' => 'required|string',
                'pwd_pers'   => 'required|string',
            ]);

            // Vérification du login
            $personnel = Personnel::where('login_pers', $credentials['login_pers'])->first();

            if (!$personnel || !Hash::check($credentials['pwd_pers'], $personnel->pwd_pers)) {
                // 📝 Log de l'échec de connexion
                Log::channel('audit')->warning("Tentative de connexion échouée.", [
                    'login_tente' => $credentials['login_pers'],
                    'ip' => $request->ip()
                ]);

                return response()->json(['message' => 'Identifiants invalides'], 401);
            }

            // Supprime tous les anciens tokens
            $personnel->tokens()->delete();

            // Crée un nouveau token
            $token = $personnel->createToken('auth_token')->plainTextToken;

            // 📝 Log de succès de connexion
            Log::channel('audit')->info("Utilisateur connecté avec succès.", [
                'personnel_id' => $personnel->id,
                'nom' => $personnel->nom_pers,
                'ip' => $request->ip()
            ]);

            return response()->json([
                "personnel"    => $personnel,
                'access_token' => $token,
                'token_type'   => 'Bearer',
            ], 200);

        } catch (\Throwable $th) {
            // 📝 Log de l'erreur technique
            Log::channel('audit')->error("Erreur lors de la tentative de login.", [
                'error' => $th->getMessage()
            ]);

            return response()->json([
                'message' => 'Erreur lors de la connexion',
                'error'   => $th->getMessage()
            ], 500);
        }
    }

    public function logout(Request $request)
    {
        try {
            $user = $request->user();
            
            // 📝 Log avant la déconnexion
            Log::channel('audit')->info("Utilisateur en cours de déconnexion.", [
                'personnel_id' => $user->id,
                'nom' => $user->nom_pers
            ]);

            $user->currentAccessToken()->delete();

            return response()->json(['message' => 'Déconnexion réussie'], 200);

        } catch (\Throwable $th) {
            // 📝 Log de l'erreur technique
            Log::channel('audit')->error("Erreur lors de la déconnexion.", [
                'error' => $th->getMessage()
            ]);

            return response()->json([
                'message' => 'Erreur lors de la déconnexion',
                'error'   => $th->getMessage()
            ], 500);
        }
    }
}