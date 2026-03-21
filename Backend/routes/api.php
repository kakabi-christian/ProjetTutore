<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - ExchaPay
|--------------------------------------------------------------------------
*/

// --- ROUTES PUBLIQUES (Accessibles sans token) ---

// Inscription et Connexion
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Vérification OTP (Email)
Route::post('/verify-otp', [AuthController::class, 'verifyOtp']);

// Mot de passe oublié
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

// --- ROUTES PROTÉGÉES (Nécessitent un Bearer Token) ---

Route::middleware('auth:sanctum')->group(function () {

    // Déconnexion
    Route::post('/logout', [AuthController::class, 'logout']);

    // Exemple de route pour récupérer l'utilisateur connecté
    Route::get('/me', function (Request $request) {
        return $request->user();
    });
});
