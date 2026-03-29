<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kyc;
use App\Models\Document;
use App\Http\Requests\KycRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

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
            return DB::transaction(function () use ($request) {
                $user = $request->user();

                // 1. Création de l'entrée dans la table KYCs
                $kyc = Kyc::create([
                    'user_id' => $user->user_id,
                    'current_level' => 1,
                    'status' => 'PENDING',
                ]);

                // 2. Boucle sur les documents envoyés
                if ($request->has('documents')) {
                    foreach ($request->file('documents') as $index => $docData) {
                        $file = $docData['file'];
                        
                        // Stockage physique du fichier
                        $fileName = time() . '_' . $file->getClientOriginalName();
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
                    'kyc_id' => $kyc->kyc_id
                ], 201);
            });
        } catch (\Exception $e) {
            Log::error("Erreur KYC Store: " . $e->getMessage());
            return response()->json(['message' => 'Échec de la soumission du dossier.'], 500);
        }
    }

    /**
     * Afficher un dossier KYC précis avec ses documents.
     */
    public function show(int $id): JsonResponse
    {
        $kyc = Kyc::with(['utilisateur', 'documents.typeDocument'])->find($id);

        if (!$kyc) {
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

        if (!$kyc) return response()->json(['message' => 'Dossier introuvable.'], 404);

        $kyc->update([
            'status' => 'APPROVED',
            'rejection_reason' => null,
            'completed_at' => now()
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
            'reason' => 'required|string|min:10'
        ]);

        $kyc = Kyc::find($id);

        if (!$kyc) return response()->json(['message' => 'Dossier introuvable.'], 404);

        $kyc->update([
            'status' => 'REJECTED',
            'rejection_reason' => $request->reason,
            'completed_at' => now()
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
}