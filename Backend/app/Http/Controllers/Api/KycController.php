<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\KycRequest;
use App\Models\Document;
use App\Models\Kyc;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class KycController extends Controller
{
    /**
     * Liste des dossiers KYC avec pagination (pour l'Admin).
     */
    public function index(): JsonResponse
    {
        try {
            $perPage = request()->get('per_page', 10);

            // On charge l'utilisateur et ses documents liés
            $kycs = Kyc::with(['utilisateur', 'documents.typeDocument'])
                ->latest()
                ->paginate($perPage);

            return response()->json([
                'message' => 'Liste des dossiers KYC récupérée.',
                'data' => $kycs->items(),
                'pagination' => [
                    'total' => $kycs->total(),
                    'current_page' => $kycs->currentPage(),
                    'last_page' => $kycs->lastPage(),
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la récupération.'], 500);
        }
    }

    /**
     * Soumission d'un dossier (Création KYC + Documents).
     */
    public function store(KycRequest $request): JsonResponse
    {
        try {
            $user = $request->user();

            // --- VÉRIFICATION DE SÉCURITÉ ---
            // On cherche s'il existe déjà un KYC non rejeté pour cet utilisateur
            $existingKyc = Kyc::where('user_id', $user->user_id)
                ->whereIn('status', ['PENDING', 'APPROVED'])
                ->first();

            if ($existingKyc) {
                $message = $existingKyc->status === 'APPROVED'
                    ? 'Votre compte est déjà vérifié (KYC Approuvé).'
                    : 'Une demande de vérification est déjà en cours d\'examen.';

                return response()->json([
                    'message' => $message,
                    'status' => $existingKyc->status,
                ], 403); // 403 Forbidden car l'action est interdite dans cet état
            }

            return DB::transaction(function () use ($request, $user) {

                // 1. Création de l'entrée dans la table KYCs
                $kyc = Kyc::create([
                    'user_id' => $user->user_id,
                    'current_level' => 1,
                    'status' => 'PENDING',
                ]);

                // 2. Boucle sur les documents envoyés
                if ($request->has('documents')) {
                    // Utiliser $request->file('documents') directement si c'est un tableau de fichiers
                    foreach ($request->file('documents') as $index => $docFile) {
                        // Si tes données de fichiers sont structurées différemment, ajuste ici
                        $file = is_array($docFile) ? $docFile['file'] : $docFile;

                        // Stockage physique du fichier
                        $fileName = time().'_'.$file->getClientOriginalName();
                        $path = $file->storeAs('kyc_documents', $fileName, 'public');

                        // Création de l'entrée dans la table Documents
                        Document::create([
                            'kyc_id' => $kyc->kyc_id,
                            'type_document_id' => $request->input("documents.$index.type_document_id"),
                            'country_of_issue' => $request->country_of_issue,
                            'file_url' => $path,
                            'status' => 'PENDING',
                        ]);
                    }
                }

                return response()->json([
                    'message' => 'Dossier KYC soumis avec succès.',
                    'kyc_id' => $kyc->kyc_id,
                ], 201);
            });

        } catch (\Exception $e) {
            Log::error('Erreur KYC Store: '.$e->getMessage());

            return response()->json(['message' => 'Échec de la soumission du dossier.'], 500);
        }
    }

    /**
     * Afficher un dossier KYC précis avec ses documents.
     */
    public function show(int $id): JsonResponse
    {
        $kyc = Kyc::with(['utilisateur', 'documents.typeDocument'])->find($id);

        if (! $kyc) {
            return response()->json(['message' => 'Dossier non trouvé.'], 404);
        }

        return response()->json(['data' => $kyc], 200);
    }

    /**
     * Approuver un dossier KYC.
     */
    public function approve(int $id): JsonResponse
    {
        $kyc = Kyc::find($id);

        if (! $kyc) {
            return response()->json(['message' => 'Dossier introuvable.'], 404);
        }

        $kyc->update([
            'status' => 'APPROVED',
            'rejection_reason' => null,
            'completed_at' => now(),
        ]);

        // On approuve aussi tous les documents rattachés
        $kyc->documents()->update(['status' => 'APPROVED']);

        return response()->json(['message' => 'Le dossier KYC a été approuvé.']);
    }

    /**
     * Rejeter un dossier KYC avec motif.
     */
    public function reject(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'reason' => 'required|string|min:10',
        ]);

        $kyc = Kyc::find($id);

        if (! $kyc) {
            return response()->json(['message' => 'Dossier introuvable.'], 404);
        }

        $kyc->update([
            'status' => 'REJECTED',
            'rejection_reason' => $request->reason,
            'completed_at' => now(),
        ]);

        // On marque les documents comme rejetés
        $kyc->documents()->update(['status' => 'REJECTED']);

        return response()->json(['message' => 'Le dossier KYC a été rejeté.']);
    }

    /**
     * Récupérer le dernier KYC de l'utilisateur connecté (pour son Dashboard).
     */
    public function getUserStatus(Request $request): JsonResponse
    {
        $kyc = Kyc::where('user_id', $request->user()->user_id)
            ->with('documents')
            ->latest()
            ->first();

        return response()->json(['data' => $kyc]);
    }

    /**
     * Récupère le nombre de dossiers KYC en attente (pour la sidebar).
     */
    public function getPendingCount(): JsonResponse
    {
        Log::info('[KYC_COUNT] Début de la requête pour récupérer le compteur PENDING.');

        try {
            // 1. Vérification de l'existence du modèle Kyc (au cas où il y aurait un souci d'import)
            if (! class_exists('App\Models\Kyc')) {
                Log::error("[KYC_COUNT] Erreur Critique : Le modèle App\Models\Kyc n'existe pas ou est mal importé.");

                return response()->json(['message' => 'Modèle introuvable.'], 500);
            }

            // 2. Log de la requête SQL avant exécution
            Log::debug("[KYC_COUNT] Exécution de la requête : SELECT COUNT(*) FROM kycs WHERE status = 'PENDING'");

            $count = Kyc::where('status', 'PENDING')->count();

            Log::info('[KYC_COUNT] Succès ! Compteur trouvé : '.$count);

            return response()->json([
                'count' => $count,
                'debug_status' => 'OK',
            ], 200);

        } catch (QueryException $e) {
            // Log spécifique aux erreurs de Base de Données (ex: colonne status manquante)
            Log::error('[KYC_COUNT] Erreur SQL : '.$e->getMessage(), [
                'sql' => $e->getSql(),
                'bindings' => $e->getBindings(),
            ]);

            return response()->json([
                'message' => 'Erreur de base de données.',
                'error_detail' => $e->getMessage(),
            ], 500);

        } catch (\Exception $e) {
            // Log pour toutes les autres erreurs
            Log::error('[KYC_COUNT] Exception Générale : '.$e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Erreur lors du comptage.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
