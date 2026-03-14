<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\FiliereController;
use App\Http\Controllers\NiveauController;
use App\Http\Controllers\UeController;
use App\Http\Controllers\EcController;
use App\Http\Controllers\SalleController;
use App\Http\Controllers\ProgrammationController;
use App\Http\Controllers\PersonnelController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\EnseigneController;

// --- Routes Publiques ---
Route::post('/login', [AuthController::class, 'login']);
Route::apiResource("personnels", PersonnelController::class);


// --- Routes Sécurisées (Sanctum) ---
Route::middleware('auth:sanctum')->group(function () {
    
    // Auth & Logout
    Route::post('/logout', [AuthController::class, 'logout']);
    
    // Ressources API
    // Route::apiResource("personnels", PersonnelController::class);
    Route::apiResource("enseignes", EnseigneController::class);
    Route::apiResource("niveaux", NiveauController::class);
    Route::apiResource("ec", EcController::class);
    Route::apiResource("Ue", UeController::class);
    Route::apiResource("salles", SalleController::class);
    // ✅ Routes d'exportation (à mettre avant le apiResource)
    Route::get('filieres/export/pdf', [FiliereController::class, 'exportPdf']);
    Route::get('filieres/export/excel', [FiliereController::class, 'exportExcel']);
    Route::apiResource("filieres", FiliereController::class)->only(['index', 'store', 'show', 'update', 'destroy']);

    // --- Routes spécifiques pour les Exports PDF ---
        
    // ✅ Nouvelle route pour télécharger le PDF de l'IMAGE de l'EC
    Route::get('/ec/download-image/{id}', [EcController::class, 'downloadImagePdf']);
});