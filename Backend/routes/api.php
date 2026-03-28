<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TypeDocumentController;
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

// Consultation des types de documents (Public ou Utilisateur connecté selon ton besoin)
// Je les place ici pour que n'importe qui puisse voir quels documents sont acceptés
Route::get('/type-documents', [TypeDocumentController::class, 'index']);
Route::get('/type-documents/{id}', [TypeDocumentController::class, 'show']);

// --- ROUTES PROTÉGÉES (auth:sanctum) ---

Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/me', function (Request $request) {
        return $request->user();
    });

    // --- ESPACE ADMINISTRATION (Préfixe admin/) ---
    Route::middleware('is_admin')->prefix('admin')->group(function () {

        // Gestion des types de documents (Actions Admin uniquement)
        Route::post('/type-documents', [TypeDocumentController::class, 'store']);
        Route::put('/type-documents/{id}', [TypeDocumentController::class, 'update']);
        Route::delete('/type-documents/{id}', [TypeDocumentController::class, 'destroy']);

    });

});
