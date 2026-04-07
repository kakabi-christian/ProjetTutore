<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\KycRequest;
use App\Mail\KycStatusMail;
use App\Models\Document;
use App\Models\Kyc; // Import du Mailable
use App\Models\Notification;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log; // À ajouter avec les autres imports
use Illuminate\Support\Facades\Mail; // Import de la Facade Mail

class KycController extends Controller
{
    /**
     * @OA\Get(
     *      path="/admin/kycs",
     *      summary="Liste des dossiers KYC (Admin)",
     *      tags={"KYC (Admin)"},
     *      security={{"bearerAuth":{}}},
     *      @OA\Parameter(
     *          name="per_page",
     *          in="query",
     *          description="Nombre d'éléments par page",
     *          required=false,
     *          @OA\Schema(type="integer", default=10)
     *      ),
     *      @OA\Response(response=200, description="Liste récupérée")
     * )
     *
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
     * @OA\Post(
     *      path="/kyc/submit",
     *      summary="Soumission d'un dossier KYC",
     *      tags={"KYC"},
     *      security={{"bearerAuth":{}}},
     *      @OA\RequestBody(
     *          required=true,
     *          @OA\MediaType(
     *              mediaType="multipart/form-data",
     *              @OA\Schema(
     *                  @OA\Property(property="country_of_issue", type="string", example="FR"),
     *                  @OA\Property(
     *                      property="documents[0][type_document_id]",
     *                      type="integer",
     *                      example=1
     *                  ),
     *                  @OA\Property(
     *                      property="documents[0][file]",
     *                      type="string",
     *                      format="binary"
     *                  )
     *              )
     *          )
     *      ),
     *      @OA\Response(response=201, description="Dossier soumis"),
     *      @OA\Response(response=403, description="Dossier déjà soumis ou approuvé")
     * )
     *
     * Soumission d'un dossier (Création KYC + Documents).
     */
    public function store(KycRequest $request): JsonResponse
    {
        try {
            $user = $request->user();

            // --- VÉRIFICATION DE SÉCURITÉ ---
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
                ], 403);
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
                    foreach ($request->file('documents') as $index => $docFile) {
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
     * @OA\Get(
     *      path="/admin/kycs/{id}",
     *      summary="Afficher un dossier KYC précis et ses documents (Admin)",
     *      tags={"KYC (Admin)"},
     *      security={{"bearerAuth":{}}},
     *      @OA\Parameter(
     *          name="id",
     *          in="path",
     *          required=true,
     *          @OA\Schema(type="integer")
     *      ),
     *      @OA\Response(response=200, description="Dossier trouvé"),
     *      @OA\Response(response=404, description="Dossier introuvable")
     * )
     *
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
     * @OA\Post(
     *      path="/admin/kycs/{id}/approve",
     *      summary="Approuver un dossier KYC (Admin)",
     *      tags={"KYC (Admin)"},
     *      security={{"bearerAuth":{}}},
     *      @OA\Parameter(
     *          name="id",
     *          in="path",
     *          required=true,
     *          @OA\Schema(type="integer")
     *      ),
     *      @OA\Response(response=200, description="Approuvé"),
     *      @OA\Response(response=404, description="Introuvable")
     * )
     *
     * Approuver un dossier KYC.
     */
    public function approve(int $id): JsonResponse
    {
        $kyc = Kyc::with('utilisateur')->find($id);

        if (! $kyc) {
            return response()->json(['message' => 'Dossier introuvable.'], 404);
        }

        $kyc->update([
            'status' => 'APPROVED',
            'rejection_reason' => null,
            'completed_at' => now(),
        ]);

        $kyc->documents()->update(['status' => 'APPROVED']);

        // --- CRÉATION DE LA NOTIFICATION DASHBOARD ---
        Notification::create([
            'user_id' => $kyc->user_id,
            'type' => Notification::TYPE_SUCCESS,
            'title' => 'Félicitations ! KYC Approuvé ✅',
            'message' => 'Votre identité a été vérifiée avec succès. Vous avez désormais accès à toutes les fonctionnalités.',
        ]);

        // --- ENVOI DU MAIL ---
        try {
            Mail::to($kyc->utilisateur->email)->send(
                new KycStatusMail($kyc->utilisateur->name, 'APPROVED')
            );
        } catch (\Exception $e) {
            Log::error('Erreur Mail KYC Approve: '.$e->getMessage());
        }

        return response()->json(['message' => 'Le dossier KYC a été approuvé, notifié et le mail envoyé.']);
    }

    /**
     * @OA\Post(
     *      path="/admin/kycs/{id}/reject",
     *      summary="Rejeter un dossier KYC avec motif (Admin)",
     *      tags={"KYC (Admin)"},
     *      security={{"bearerAuth":{}}},
     *      @OA\Parameter(
     *          name="id",
     *          in="path",
     *          required=true,
     *          @OA\Schema(type="integer")
     *      ),
     *      @OA\RequestBody(
     *          required=true,
     *          @OA\JsonContent(
     *              required={"reason"},
     *              @OA\Property(property="reason", type="string", example="Document illisible")
     *          )
     *      ),
     *      @OA\Response(response=200, description="Rejeté"),
     *      @OA\Response(response=404, description="Introuvable")
     * )
     *
     * Rejeter un dossier KYC avec motif.
     */
    public function reject(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'reason' => 'required|string|min:10',
        ]);

        $kyc = Kyc::with('utilisateur')->find($id);

        if (! $kyc) {
            return response()->json(['message' => 'Dossier introuvable.'], 404);
        }

        $kyc->update([
            'status' => 'REJECTED',
            'rejection_reason' => $request->reason,
            'completed_at' => now(),
        ]);

        $kyc->documents()->update(['status' => 'REJECTED']);

        // --- CRÉATION DE LA NOTIFICATION DASHBOARD ---
        Notification::create([
            'user_id' => $kyc->user_id,
            'type' => Notification::TYPE_ERROR,
            'title' => 'Action requise : KYC Rejeté ❌',
            'message' => 'Votre dossier KYC a été refusé pour le motif suivant : '.$request->reason,
        ]);

        // --- ENVOI DU MAIL ---
        try {
            Mail::to($kyc->utilisateur->email)->send(
                new KycStatusMail($kyc->utilisateur->name, 'REJECTED', $request->reason)
            );
        } catch (\Exception $e) {
            Log::error('Erreur Mail KYC Reject: '.$e->getMessage());
        }

        return response()->json(['message' => 'Le dossier KYC a été rejeté, notifié et le mail envoyé.']);
    }

    /**
     * @OA\Get(
     *      path="/my-kyc",
     *      summary="Récupérer l'état de son dernier KYC",
     *      tags={"KYC"},
     *      security={{"bearerAuth":{}}},
     *      @OA\Response(response=200, description="Statut récupéré")
     * )
     *
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
     * @OA\Get(
     *      path="/admin/kycs/pending-count",
     *      summary="Récupère le nombre de dossiers KYC en attente (Admin)",
     *      tags={"KYC (Admin)"},
     *      security={{"bearerAuth":{}}},
     *      @OA\Response(response=200, description="Nombre de KYC en attente")
     * )
     *
     * Récupère le nombre de dossiers KYC en attente (pour la sidebar).
     */
    public function getPendingCount(): JsonResponse
    {
        Log::info('[KYC_COUNT] Début de la requête pour récupérer le compteur PENDING.');

        try {
            if (! class_exists('App\Models\Kyc')) {
                Log::error("[KYC_COUNT] Erreur Critique : Le modèle App\Models\Kyc n'existe pas.");

                return response()->json(['message' => 'Modèle introuvable.'], 500);
            }

            $count = Kyc::where('status', 'PENDING')->count();

            Log::info('[KYC_COUNT] Succès ! Compteur trouvé : '.$count);

            return response()->json([
                'count' => $count,
                'debug_status' => 'OK',
            ], 200);

        } catch (QueryException $e) {
            Log::error('[KYC_COUNT] Erreur SQL : '.$e->getMessage());

            return response()->json(['message' => 'Erreur de base de données.'], 500);

        } catch (\Exception $e) {
            Log::error('[KYC_COUNT] Exception Générale : '.$e->getMessage());

            return response()->json(['message' => 'Erreur lors du comptage.'], 500);
        }
    }
}
