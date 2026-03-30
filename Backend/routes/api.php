<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\KycController;
use App\Http\Controllers\Api\TypeDocumentController; // Import du nouveau contrôleur
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - ExchaPay
|--------------------------------------------------------------------------
*/

// --- ROUTES PUBLIQUES ---

// Authentification & OTP
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/verify-otp', [AuthController::class, 'verifyOtp']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

// Consultation des types de documents
Route::get('/type-documents', [TypeDocumentController::class, 'index']);
Route::get('/type-documents/{id}', [TypeDocumentController::class, 'show']);

// --- ROUTES PROTÉGÉES (auth:sanctum) ---

Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/me', function (Request $request) {
        return $request->user();
    });

    // --- ESPACE UTILISATEUR (Client) ---

    // Soumettre un dossier complet (KYC + Documents)
    Route::post('/kyc/submit', [KycController::class, 'store']);

    // Consulter son propre statut KYC actuel
    Route::get('/my-kyc', [KycController::class, 'getUserStatus']);

    // --- ESPACE ADMINISTRATION (Préfixe admin/) ---

    Route::middleware('is_admin')->prefix('admin')->group(function () {

        // Gestion des types de documents
        Route::post('/type-documents', [TypeDocumentController::class, 'store']);
        Route::put('/type-documents/{id}', [TypeDocumentController::class, 'update']);
        Route::delete('/type-documents/{id}', [TypeDocumentController::class, 'destroy']);

        // Gestion des dossiers KYC par l'Admin
        Route::get('/kycs', [KycController::class, 'index']);
        Route::get('/kycs/pending-count', [KycController::class, 'getPendingCount']);
        Route::get('/kycs/{id}', [KycController::class, 'show']);       // Détails d'un dossier
        Route::post('/kycs/{id}/approve', [KycController::class, 'approve']); // Approuver
        Route::post('/kycs/{id}/reject', [KycController::class, 'reject']);   // Rejeter avec motif

    });

});
