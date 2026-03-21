<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AuthRequest;
use App\Mail\OtpRegistrationMail;
use App\Mail\ResetPasswordMail;
use App\Models\Utilisateur; // AJOUT : Import du mail de reset
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class AuthController extends Controller
{
    /**
     * Inscription (Register)
     */
    public function register(AuthRequest $request)
    {
        Log::info('>>> REGISTER DÉMARRÉ (GMAIL)');

        $data = $request->validated();
        $otpCode = rand(100000, 999999);

        DB::beginTransaction();
        try {
            $data['password'] = Hash::make($data['password']);
            $user = Utilisateur::create($data);

            // TODO : Enregistrer $otpCode en base de données ici

            DB::commit();

            try {
                Mail::to($user->email)->send(new OtpRegistrationMail(
                    $user->firstname.' '.$user->lastname,
                    $otpCode
                ));
            } catch (\Exception $e) {
                Log::error('Échec envoi OTP Inscription : '.$e->getMessage());
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Inscription réussie. Vérifiez vos emails.',
                'user' => $user,
                'debug_otp' => $otpCode,
            ], 201);

        } catch (\Throwable $th) {
            DB::rollBack();
            Log::error('REGISTER ERREUR', ['msg' => $th->getMessage()]);

            return response()->json(['status' => 'error', 'message' => 'Erreur inscription'], 500);
        }
    }

    /**
     * Mot de passe oublié (Forgot Password)
     */
    public function forgotPassword(AuthRequest $request)
    {
        Log::info('>>> FORGOT PASSWORD DÉMARRÉ', ['email' => $request->email]);
        try {
            $user = Utilisateur::where('email', $request->email)->first();

            if (! $user) {
                return response()->json(['message' => 'Utilisateur non trouvé'], 404);
            }

            $tempCode = rand(100000, 999999);

            // ENVOI VIA GMAIL
            Mail::to($user->email)->send(new ResetPasswordMail(
                $user->firstname,
                $tempCode
            ));

            return response()->json([
                'status' => 'success',
                'message' => 'Code de réinitialisation envoyé.',
                'debug_code' => $tempCode,
            ]);

        } catch (\Throwable $th) {
            Log::error('FORGOT PASSWORD ERREUR', ['msg' => $th->getMessage()]);

            return response()->json(['message' => 'Erreur envoi code'], 500);
        }
    }

    /**
     * Connexion (Login)
     */
    /**
     * Connexion (Login) avec chargement des Rôles et Permissions
     */
    public function login(AuthRequest $request)
    {
        Log::info('>>> LOGIN DÉMARRÉ', ['email' => $request->email]);
        try {
            $credentials = $request->validated();

            // 1. On récupère l'utilisateur avec ses rôles ET les permissions de chaque rôle
            // La notation 'roles.permissions' permet de descendre dans la profondeur des relations
            $user = Utilisateur::with(['roles.permissions'])
                ->where('email', $credentials['email'])
                ->first();

            if (! $user || ! Hash::check($credentials['password'], $user->password)) {
                return response()->json(['message' => 'Identifiants incorrects'], 401);
            }

            if (! $user->isactive) {
                return response()->json(['message' => 'Votre compte est suspendu.'], 403);
            }

            // 2. Gestion des tokens
            $user->tokens()->delete();
            $token = $user->createToken('auth_token')->plainTextToken;

            $user->update(['lastlogin' => now()]);

            // 3. Réponse avec l'objet utilisateur complet (incluant rôles et permissions)
            return response()->json([
                'user' => $user,
                'access_token' => $token,
                'token_type' => 'Bearer',
            ], 200);

        } catch (\Throwable $th) {
            Log::error('LOGIN ERREUR', ['msg' => $th->getMessage()]);

            return response()->json(['message' => 'Erreur connexion'], 500);
        }
    }

    /**
     * Vérification OTP
     */
    public function verifyOtp(AuthRequest $request)
    {
        $user = Utilisateur::where('email', $request->email)->first();
        if ($user) {
            $user->update(['isverified' => true]);

            return response()->json(['message' => 'Compte vérifié !']);
        }

        return response()->json(['message' => 'Non trouvé'], 404);
    }

    /**
     * Déconnexion
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Déconnexion réussie']);
    }
}
