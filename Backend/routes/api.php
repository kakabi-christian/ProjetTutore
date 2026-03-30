<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\FeedbackController;
use App\Http\Controllers\Api\KycController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\TypeDocumentController;
use App\Http\Controllers\Api\UtilisateurController;
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

    // --- GESTION DU COMPTE & PROFIL ---
    // Utilise le contrôleur pour une réponse uniforme
    Route::get('/me', [UtilisateurController::class, 'profile']);
    Route::put('/profile/update', [UtilisateurController::class, 'updateProfile']);
    Route::post('/profile/password', [UtilisateurController::class, 'updatePassword']);

    // --- ESPACE UTILISATEUR (Client) ---

    // Soumettre un dossier complet (KYC + Documents)
    Route::post('/kyc/submit', [KycController::class, 'store']);

    // Consulter son propre statut KYC actuel
    Route::get('/my-kyc', [KycController::class, 'getUserStatus']);

    // Notifications Utilisateur
    Route::get('notifications', [NotificationController::class, 'index']);
    Route::get('notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::patch('notifications/{id}/mark-as-read', [NotificationController::class, 'markAsRead']);
    Route::post('notifications/mark-all-as-read', [NotificationController::class, 'markAllAsRead']);

    // Feedback
    Route::post('/feedback', [FeedbackController::class, 'store']);

    // --- ESPACE ADMINISTRATION (Préfixe admin/) ---

    Route::middleware('is_admin')->prefix('admin')->group(function () {

        // Gestion des utilisateurs
        Route::get('/users-list', [UtilisateurController::class, 'getUsersList']);
        // Tu pourras ajouter ici : Route::get('/users/{id}', [UtilisateurController::class, 'show']);

        // Gestion des types de documents
        Route::post('/type-documents', [TypeDocumentController::class, 'store']);
        Route::put('/type-documents/{id}', [TypeDocumentController::class, 'update']);
        Route::delete('/type-documents/{id}', [TypeDocumentController::class, 'destroy']);

        // Gestion des dossiers KYC par l'Admin
        Route::get('/kycs', [KycController::class, 'index']);
        Route::get('/kycs/pending-count', [KycController::class, 'getPendingCount']);
        Route::get('/kycs/{id}', [KycController::class, 'show']);
        Route::post('/kycs/{id}/approve', [KycController::class, 'approve']);
        Route::post('/kycs/{id}/reject', [KycController::class, 'reject']);

        // Gestion des Notifications (Admin)
        Route::get('notifications', [NotificationController::class, 'index']);
        Route::get('notifications/unread-count', [NotificationController::class, 'unreadCount']);
        Route::patch('notifications/{id}/mark-as-read', [NotificationController::class, 'markAsRead']);
        Route::post('notifications/mark-all-as-read', [NotificationController::class, 'markAllAsRead']);
        Route::delete('notifications/{id}', [NotificationController::class, 'destroy']);
        Route::post('notifications', [NotificationController::class, 'store']);

    });

});
