<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\FeedbackController;
use App\Http\Controllers\Api\KycController;
use App\Http\Controllers\Api\ListingController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PermissionController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\RolePermissionController;
use App\Http\Controllers\Api\StatisticsController;
use App\Http\Controllers\Api\PaymentMethodController; // ✅ Ajout du contrôleur
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\TypeDocumentController;
use App\Http\Controllers\Api\UtilisateurController;
use App\Http\Controllers\Api\WebhookController;
use App\Services\ExchangeRateService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - ExchaPay
|--------------------------------------------------------------------------
*/

// --- ROUTES PUBLIQUES ---

// Authentification
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/verify-otp', [AuthController::class, 'verifyOtp']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

/**
 * 📈 Consultation des taux en direct
 */
Route::get('/market-rate', function (Request $request, ExchangeRateService $service) {
    $from = $request->query('from');
    $to = $request->query('to');

    if (! $from || ! $to) {
        return response()->json(['error' => 'Les devises from et to sont requises'], 400);
    }

    $rate = $service->getLiveRate($from, $to);

    return response()->json([
        'from' => strtoupper($from),
        'to' => strtoupper($to),
        'rate' => $rate,
        'timestamp' => now(),
    ]);
});

// Consultation des documents / Annonces
Route::get('/type-documents', [TypeDocumentController::class, 'index']);
Route::get('/type-documents/{id}', [TypeDocumentController::class, 'show']);
Route::get('/listings', [ListingController::class, 'index']);
Route::get('/listings/{id}', [ListingController::class, 'show']);
Route::get('/listings/{listing_id}/reviews', [ReviewController::class, 'index']);


// -------------------------------------------------------
// WEBHOOK — Route publique (pas d'auth, Flutterwave appelle ici)
// Ref: https://developer.flutterwave.com/docs/integration-guides/webhooks
// -------------------------------------------------------
Route::post('/webhooks/flutterwave', [WebhookController::class, 'handle'])
    ->name('webhooks.flutterwave');



// --- ROUTES PROTÉGÉES (auth:sanctum) ---
Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);

    // Gestion du profil
    Route::get('/me', [UtilisateurController::class, 'profile']);
    Route::put('/profile/update', [UtilisateurController::class, 'updateProfile']);
    Route::post('/profile/password', [UtilisateurController::class, 'updatePassword']);

    // 📊 Statistiques de l'utilisateur
    Route::get('/my-statistics', [StatisticsController::class, 'userStats']);

    // ✅ GESTION DES MÉTHODES DE PAIEMENT (Flutterwave integration)
    // Route pour lister les banques/réseaux mobiles dispos par pays
    Route::get('/payment-methods/available', [PaymentMethodController::class, 'availableMethods']);
    // CRUD : index (paginé), store, destroy
    Route::apiResource('payment-methods', PaymentMethodController::class)->only(['index', 'store', 'destroy']);

    // KYC
    Route::post('/kyc/submit', [KycController::class, 'store']);
    Route::get('/my-kyc', [KycController::class, 'getUserStatus']);

    // Notifications
    Route::get('notifications', [NotificationController::class, 'index']);
    Route::get('notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::patch('notifications/{id}/mark-as-read', [NotificationController::class, 'markAsRead']);

    // Feedback
    Route::post('/feedback', [FeedbackController::class, 'store']);

    // Gestion des annonces
    Route::post('/listings', [ListingController::class, 'store']);
    Route::put('/listings/{id}', [ListingController::class, 'update']);
    Route::delete('/listings/{id}', [ListingController::class, 'destroy']);
    Route::get('/my-listings', [ListingController::class, 'userListings']);

    // Reviews
    Route::post('/listings/{listing_id}/reviews', [ReviewController::class, 'store']);
    Route::put('/reviews/{id}', [ReviewController::class, 'update']);
    Route::delete('/reviews/{id}', [ReviewController::class, 'destroy']);

    // Initier un échange : crée la transaction + retourne le payment_link Flutterwave
    Route::post('/transactions/initiate', [TransactionController::class, 'initiate'])
        ->name('transactions.initiate');


    // Route::get('/transactions/status', function (Request $request) {
    //     $txRef = $request->query('tx_ref');
    //     $tx = \App\Models\Transaction::where('flw_tx_ref', $txRef)
    //         ->where('buyer_id', auth()->id()) // sécurité : seulement ses propres transactions
    //         ->first();

    //     if (!$tx) {
    //         return response()->json(['message' => 'Transaction introuvable'], 404);
    //     }

    //     return response()->json([
    //         'status'         => $tx->status,
    //         'transaction_id' => $tx->transaction_id,
    //         'flw_tx_ref'     => $tx->flw_tx_ref,
    //     ]);
    // });


    // --- ESPACE ADMINISTRATION ---
    Route::middleware('is_admin')->prefix('admin')->group(function () {

        // 📊 Statistiques Globales
        Route::get('/statistics', [StatisticsController::class, 'index']);

        Route::get('/collaborators', [UtilisateurController::class, 'getAdminsList']);
        Route::post('/collaborators', [UtilisateurController::class, 'storeAdmin']);
        Route::put('/collaborators/{id}', [UtilisateurController::class, 'updateAdmin']);
        Route::delete('/collaborators/{id}', [UtilisateurController::class, 'destroyAdmin']);

        Route::apiResource('roles', RoleController::class);
        Route::get('permissions', [PermissionController::class, 'index']);
        Route::post('roles/assign-permissions', [RolePermissionController::class, 'assignPermissions']);

        Route::get('/users-list', [UtilisateurController::class, 'getUsersList']);

        Route::post('/type-documents', [TypeDocumentController::class, 'store']);
        Route::put('/type-documents/{id}', [TypeDocumentController::class, 'update']);
        Route::delete('/type-documents/{id}', [TypeDocumentController::class, 'destroy']);

        Route::get('/kycs', [KycController::class, 'index']);
        Route::get('/kycs/pending-count', [KycController::class, 'getPendingCount']);
        Route::get('/kycs/{id}', [KycController::class, 'show']);
        Route::post('/kycs/{id}/approve', [KycController::class, 'approve']);
        Route::post('/kycs/{id}/reject', [KycController::class, 'reject']);

        Route::get('admin-notifications', [NotificationController::class, 'index']);
        Route::delete('notifications/{id}', [NotificationController::class, 'destroy']);
        Route::post('notifications', [NotificationController::class, 'store']);
    });
});
