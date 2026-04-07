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
     * @OA\Post(
     *      path="/register",
     *      summary="Inscription d'un nouvel utilisateur",
     *      tags={"Auth"},
     *      @OA\RequestBody(
     *          required=true,
     *          @OA\JsonContent(
     *              required={"firstname","lastname","email","password"},
     *              @OA\Property(property="firstname", type="string", example="John"),
     *              @OA\Property(property="lastname", type="string", example="Doe"),
     *              @OA\Property(property="email", type="string", format="email", example="john@example.com"),
     *              @OA\Property(property="password", type="string", format="password", example="secret123"),
     *              @OA\Property(property="pseudonyme", type="string", example="johndoe")
     *          )
     *      ),
     *      @OA\Response(response=201, description="Inscription réussie")
     * )
     *
     * Inscription (Register)
     */
    public function register(AuthRequest $request)
    {
        Log::info('>>> REGISTER DÉMARRÉ (GMAIL)');
        Log::info('Données reçues', ['data' => $request->validated()]);

        $data = $request->validated();
        $otpCode = rand(100000, 999999);
        Log::info('OTP généré', ['otp' => $otpCode]);

        DB::beginTransaction();
        Log::info('Transaction DB ouverte');

        try {
            $data['password'] = Hash::make($data['password']);
            Log::info('Mot de passe hashé');

            $user = Utilisateur::create($data);
            Log::info('Utilisateur créé', ['user_id' => $user->id, 'email' => $user->email]);

            // TODO : Enregistrer $otpCode en base de données ici

            DB::commit();
            Log::info('Transaction DB commitée');

            Log::info('Tentative envoi mail OTP', [
                'to' => $user->email,
                'mailer' => config('mail.default'),
                'host' => config('mail.mailers.smtp.host'),
                'port' => config('mail.mailers.smtp.port'),
                'username' => config('mail.mailers.smtp.username'),
            ]);

            try {
                Mail::to($user->email)->send(new OtpRegistrationMail(
                    $user->firstname.' '.$user->lastname,
                    $otpCode
                ));
                Log::info('Mail OTP envoyé avec succès', ['to' => $user->email]);
            } catch (\Exception $e) {
                Log::error('Échec envoi OTP Inscription', [
                    'message' => $e->getMessage(),
                    'exception' => get_class($e),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => $e->getTraceAsString(),
                ]);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Inscription réussie. Vérifiez vos emails.',
                'user' => $user,
                'debug_otp' => $otpCode,
            ], 201);

        } catch (\Throwable $th) {
            DB::rollBack();
            Log::error('REGISTER ERREUR', [
                'message' => $th->getMessage(),
                'exception' => get_class($th),
                'file' => $th->getFile(),
                'line' => $th->getLine(),
                'trace' => $th->getTraceAsString(),
            ]);

            return response()->json(['status' => 'error', 'message' => 'Erreur inscription'], 500);
        }
    }

    /**
     * @OA\Post(
     *      path="/forgot-password",
     *      summary="Mot de passe oublié, envoi d'OTP",
     *      tags={"Auth"},
     *      @OA\RequestBody(
     *          required=true,
     *          @OA\JsonContent(
     *              required={"email"},
     *              @OA\Property(property="email", type="string", format="email", example="john@example.com")
     *          )
     *      ),
     *      @OA\Response(response=200, description="Code envoyé"),
     *      @OA\Response(response=404, description="Utilisateur non trouvé")
     * )
     *
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
     * @OA\Post(
     *      path="/login",
     *      summary="Connexion de l'utilisateur",
     *      tags={"Auth"},
     *      @OA\RequestBody(
     *          required=true,
     *          @OA\JsonContent(
     *              required={"email","password"},
     *              @OA\Property(property="email", type="string", format="email", example="john@example.com"),
     *              @OA\Property(property="password", type="string", format="password", example="secret123")
     *          )
     *      ),
     *      @OA\Response(response=200, description="Connexion réussie"),
     *      @OA\Response(response=401, description="Identifiants incorrects"),
     *      @OA\Response(response=403, description="Compte non vérifié ou suspendu")
     * )
     *
     * Connexion (Login) avec chargement des Rôles et Permissions
     */
    public function login(AuthRequest $request)
    {
        Log::info('>>> LOGIN DÉMARRÉ', ['email' => $request->email]);
        try {
            $credentials = $request->validated();

            $user = Utilisateur::with(['roles.permissions'])
                ->where('email', $credentials['email'])
                ->first();

            if (! $user || ! Hash::check($credentials['password'], $user->password)) {
                return response()->json(['message' => 'Identifiants incorrects'], 401);
            }

            // --- GESTION DU COMPTE NON VÉRIFIÉ ---
            if (! $user->isverified) {
                // 1. On génère un nouveau code OTP
                $newOtpCode = rand(100000, 999999);

                // 2. TODO : Sauvegarder ce code en base (ex: table password_resets ou colonne otp dans utilisateur)
                // $user->update(['otp_code' => $newOtpCode]);

                // 3. On renvoie l'email immédiatement
                try {
                    Mail::to($user->email)->send(new OtpRegistrationMail(
                        $user->firstname.' '.$user->lastname,
                        $newOtpCode
                    ));
                } catch (\Exception $e) {
                    Log::error('Échec renvoi OTP au Login : '.$e->getMessage());
                }

                return response()->json([
                    'message' => 'Votre compte n\'est pas vérifié. Un nouveau code OTP a été envoyé à votre adresse email.',
                    'needs_verification' => true,
                    'email' => $user->email,
                    'debug_otp' => $newOtpCode, // À retirer en production
                ], 403);
            }

            if (! $user->isactive) {
                return response()->json(['message' => 'Votre compte est suspendu.'], 403);
            }

            // ... reste du code (génération token, lastlogin)
            $user->tokens()->delete();
            $token = $user->createToken('auth_token')->plainTextToken;
            $user->update(['lastlogin' => now()]);

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
     * @OA\Post(
     *      path="/verify-otp",
     *      summary="Vérification OTP",
     *      tags={"Auth"},
     *      @OA\RequestBody(
     *          required=true,
     *          @OA\JsonContent(
     *              required={"email","otp"},
     *              @OA\Property(property="email", type="string", format="email", example="john@example.com"),
     *              @OA\Property(property="otp", type="string", example="123456")
     *          )
     *      ),
     *      @OA\Response(response=200, description="Compte vérifié"),
     *      @OA\Response(response=404, description="Non trouvé")
     * )
     *
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
     * @OA\Post(
     *      path="/logout",
     *      summary="Déconnexion",
     *      tags={"Auth"},
     *      security={{"bearerAuth":{}}},
     *      @OA\Response(response=200, description="Déconnexion réussie")
     * )
     *
     * Déconnexion
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Déconnexion réussie']);
    }
}
