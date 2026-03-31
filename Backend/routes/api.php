<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\FeedbackController;
use App\Http\Controllers\Api\KycController;
use App\Http\Controllers\Api\ListingController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PermissionController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\RolePermissionController;
use App\Http\Controllers\Api\TypeDocumentController;
use App\Http\Controllers\Api\UtilisateurController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - ExchaPay
|--------------------------------------------------------------------------
*/

// --- ROUTES PUBLIQUES ---
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/verify-otp', [AuthController::class, 'verifyOtp']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

Route::get('/type-documents', [TypeDocumentController::class, 'index']);
Route::get('/type-documents/{id}', [TypeDocumentController::class, 'show']);

Route::get('/listings', [ListingController::class, 'index']);
Route::get('/listings/{id}', [ListingController::class, 'show']);

// --- ROUTES PROTÉGÉES (auth:sanctum) ---
Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);

    // --- GESTION DU COMPTE & PROFIL ---
    Route::get('/me', [UtilisateurController::class, 'profile']);
    Route::put('/profile/update', [UtilisateurController::class, 'updateProfile']);
    Route::post('/profile/password', [UtilisateurController::class, 'updatePassword']);

    // --- ESPACE UTILISATEUR (Client) ---
    Route::post('/kyc/submit', [KycController::class, 'store']);
    Route::get('/my-kyc', [KycController::class, 'getUserStatus']);

    Route::get('notifications', [NotificationController::class, 'index']);
    Route::get('notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::patch('notifications/{id}/mark-as-read', [NotificationController::class, 'markAsRead']);

    Route::post('/feedback', [FeedbackController::class, 'store']);

    Route::post('/listings', [ListingController::class, 'store']);
    Route::put('/listings/{id}', [ListingController::class, 'update']);
    Route::delete('/listings/{id}', [ListingController::class, 'destroy']);

    // --- ESPACE ADMINISTRATION (Préfixe admin/) ---
    Route::middleware('is_admin')->prefix('admin')->group(function () {

        // ✅ Gestion des Administrateurs / Collaborateurs
        Route::get('/collaborators', [UtilisateurController::class, 'getAdminsList']);
        Route::post('/collaborators', [UtilisateurController::class, 'storeAdmin']);
        Route::put('/collaborators/{id}', [UtilisateurController::class, 'updateAdmin']);
        Route::delete('/collaborators/{id}', [UtilisateurController::class, 'destroyAdmin']);

        // ✅ Gestion des Rôles
        Route::apiResource('roles', RoleController::class);

        // ✅ Gestion des Permissions & Assignations
        Route::get('permissions', [PermissionController::class, 'index']);
        Route::post('roles/assign-permissions', [RolePermissionController::class, 'assignPermissions']);

        // Gestion des utilisateurs (Liste simple type 'user')
        Route::get('/users-list', [UtilisateurController::class, 'getUsersList']);

        // Gestion des types de documents
        Route::post('/type-documents', [TypeDocumentController::class, 'store']);
        Route::put('/type-documents/{id}', [TypeDocumentController::class, 'update']);
        Route::delete('/type-documents/{id}', [TypeDocumentController::class, 'destroy']);

        // Gestion des dossiers KYC
        Route::get('/kycs', [KycController::class, 'index']);
        Route::get('/kycs/pending-count', [KycController::class, 'getPendingCount']);
        Route::get('/kycs/{id}', [KycController::class, 'show']);
        Route::post('/kycs/{id}/approve', [KycController::class, 'approve']);
        Route::post('/kycs/{id}/reject', [KycController::class, 'reject']);

        // Gestion des Notifications
        Route::get('admin-notifications', [NotificationController::class, 'index']);
        Route::delete('notifications/{id}', [NotificationController::class, 'destroy']);
        Route::post('notifications', [NotificationController::class, 'store']);

    });
});
