<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\TypeDocumentRequest;
use App\Models\TypeDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class TypeDocumentController extends Controller
{
    /**
     * Afficher la liste de tous les types de documents.
     */
    /**
     * Afficher la liste des types de documents avec pagination.
     */
    public function index(): JsonResponse
    {
        try {
            // On récupère le nombre d'éléments par page depuis la requête, sinon 10 par défaut
            $perPage = request()->get('per_page', 10);

            // paginate() gère automatiquement le paramètre ?page= dans l'URL
            $typeDocuments = TypeDocument::paginate($perPage);

            return response()->json([
                'message' => 'Liste des types de documents récupérée avec succès.',
                'data' => $typeDocuments->items(), // Les données réelles
                'pagination' => [
                    'total' => $typeDocuments->total(),
                    'current_page' => $typeDocuments->currentPage(),
                    'per_page' => $typeDocuments->perPage(),
                    'last_page' => $typeDocuments->lastPage(),
                    'from' => $typeDocuments->firstItem(),
                    'to' => $typeDocuments->lastItem(),
                ],
            ], 200);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des types de documents.', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Une erreur est survenue lors de la récupération des types de documents.',
            ], 500);
        }
    }

    /**
     * Créer un nouveau type de document.
     */
    public function store(TypeDocumentRequest $request): JsonResponse
    {
        try {
            $typeDocument = TypeDocument::create($request->validated());

            Log::info('Type de document créé.', ['type_document_id' => $typeDocument->type_document_id, 'name' => $typeDocument->name]);

            return response()->json([
                'message' => 'Type de document créé avec succès.',
                'data' => $typeDocument,
            ], 201);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la création d\'un type de document.', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all(),
            ]);

            return response()->json([
                'message' => 'Une erreur est survenue lors de la création du type de document.',
            ], 500);
        }
    }

    /**
     * Afficher un type de document spécifique.
     */
    public function show(int $id): JsonResponse
    {
        try {
            $typeDocument = TypeDocument::find($id);

            if (! $typeDocument) {
                return response()->json([
                    'message' => 'Type de document non trouvé.',
                ], 404);
            }

            return response()->json([
                'message' => 'Type de document récupéré avec succès.',
                'data' => $typeDocument,
            ], 200);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération d\'un type de document.', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'type_document_id' => $id,
            ]);

            return response()->json([
                'message' => 'Une erreur est survenue lors de la récupération du type de document.',
            ], 500);
        }
    }

    /**
     * Mettre à jour un type de document.
     */
    public function update(TypeDocumentRequest $request, int $id): JsonResponse
    {
        try {
            $typeDocument = TypeDocument::find($id);

            if (! $typeDocument) {
                return response()->json([
                    'message' => 'Type de document non trouvé.',
                ], 404);
            }

            $typeDocument->update($request->validated());

            Log::info('Type de document mis à jour.', ['type_document_id' => $id, 'changes' => $request->validated()]);

            return response()->json([
                'message' => 'Type de document mis à jour avec succès.',
                'data' => $typeDocument,
            ], 200);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la mise à jour d\'un type de document.', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'type_document_id' => $id,
                'request_data' => $request->all(),
            ]);

            return response()->json([
                'message' => 'Une erreur est survenue lors de la mise à jour du type de document.',
            ], 500);
        }
    }

    /**
     * Supprimer un type de document.
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $typeDocument = TypeDocument::find($id);

            if (! $typeDocument) {
                return response()->json([
                    'message' => 'Type de document non trouvé.',
                ], 404);
            }

            $typeDocument->delete();

            Log::info('Type de document supprimé.', ['type_document_id' => $id]);

            return response()->json([
                'message' => 'Type de document supprimé avec succès.',
            ], 200);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la suppression d\'un type de document.', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'type_document_id' => $id,
            ]);

            return response()->json([
                'message' => 'Une erreur est survenue lors de la suppression du type de document.',
            ], 500);
        }
    }
}
