<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\TypeDocumentRequest;
use App\Models\TypeDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

/**
 * @OA\Tag(
 *     name="Types de documents",
 *     description="Gestion des types de documents"
 * )
 */
class TypeDocumentController extends Controller
{
    /**
     * Afficher la liste de tous les types de documents.
     */
    /**
     * Afficher la liste des types de documents avec pagination.
     *
     * @OA\Get(
     *     path="/api/type-documents",
     *     summary="Liste paginée des types de documents",
     *     tags={"Types de documents"},
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="per_page",
     *         in="query",
     *         required=false,
     *         description="Nombre d'éléments par page (défaut: 10)",
     *         @OA\Schema(type="integer", default=10, example=10)
     *     ),
     *     @OA\Parameter(
     *         name="page",
     *         in="query",
     *         required=false,
     *         description="Numéro de la page",
     *         @OA\Schema(type="integer", default=1, example=1)
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Liste récupérée avec succès",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Liste des types de documents récupérée avec succès."),
     *             @OA\Property(
     *                 property="data",
     *                 type="array",
     *                 @OA\Items(ref="#/components/schemas/TypeDocument")
     *             ),
     *             @OA\Property(
     *                 property="pagination",
     *                 type="object",
     *                 @OA\Property(property="total", type="integer", example=50),
     *                 @OA\Property(property="current_page", type="integer", example=1),
     *                 @OA\Property(property="per_page", type="integer", example=10),
     *                 @OA\Property(property="last_page", type="integer", example=5),
     *                 @OA\Property(property="from", type="integer", example=1),
     *                 @OA\Property(property="to", type="integer", example=10)
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Erreur serveur",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Une erreur est survenue lors de la récupération des types de documents.")
     *         )
     *     ),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
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
                    'total'        => $typeDocuments->total(),
                    'current_page' => $typeDocuments->currentPage(),
                    'per_page'     => $typeDocuments->perPage(),
                    'last_page'    => $typeDocuments->lastPage(),
                    'from'         => $typeDocuments->firstItem(),
                    'to'           => $typeDocuments->lastItem(),
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
     *
     * @OA\Post(
     *     path="/api/type-documents",
     *     summary="Créer un nouveau type de document",
     *     tags={"Types de documents"},
     *     security={{"bearerAuth": {}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(ref="#/components/schemas/TypeDocument")
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Type de document créé avec succès",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Type de document créé avec succès."),
     *             @OA\Property(property="data", ref="#/components/schemas/TypeDocument")
     *         )
     *     ),
     *     @OA\Response(response=422, description="Données invalides"),
     *     @OA\Response(
     *         response=500,
     *         description="Erreur serveur",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Une erreur est survenue lors de la création du type de document.")
     *         )
     *     ),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function store(TypeDocumentRequest $request): JsonResponse
    {
        try {
            $typeDocument = TypeDocument::create($request->validated());

            Log::info('Type de document créé.', ['type_document_id' => $typeDocument->type_document_id, 'name' => $typeDocument->name]);

            return response()->json([
                'message' => 'Type de document créé avec succès.',
                'data'    => $typeDocument,
            ], 201);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la création d\'un type de document.', [
                'error'        => $e->getMessage(),
                'trace'        => $e->getTraceAsString(),
                'request_data' => $request->all(),
            ]);

            return response()->json([
                'message' => 'Une erreur est survenue lors de la création du type de document.',
            ], 500);
        }
    }

    /**
     * Afficher un type de document spécifique.
     *
     * @OA\Get(
     *     path="/api/type-documents/{id}",
     *     summary="Afficher un type de document spécifique",
     *     tags={"Types de documents"},
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID du type de document",
     *         @OA\Schema(type="integer", example=1)
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Type de document récupéré avec succès",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Type de document récupéré avec succès."),
     *             @OA\Property(property="data", ref="#/components/schemas/TypeDocument")
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Type de document non trouvé",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Type de document non trouvé.")
     *         )
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Erreur serveur",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Une erreur est survenue lors de la récupération du type de document.")
     *         )
     *     ),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
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
                'data'    => $typeDocument,
            ], 200);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération d\'un type de document.', [
                'error'            => $e->getMessage(),
                'trace'            => $e->getTraceAsString(),
                'type_document_id' => $id,
            ]);

            return response()->json([
                'message' => 'Une erreur est survenue lors de la récupération du type de document.',
            ], 500);
        }
    }

    /**
     * Mettre à jour un type de document.
     *
     * @OA\Put(
     *     path="/api/type-documents/{id}",
     *     summary="Mettre à jour un type de document",
     *     tags={"Types de documents"},
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID du type de document",
     *         @OA\Schema(type="integer", example=1)
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(ref="#/components/schemas/TypeDocument")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Type de document mis à jour avec succès",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Type de document mis à jour avec succès."),
     *             @OA\Property(property="data", ref="#/components/schemas/TypeDocument")
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Type de document non trouvé",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Type de document non trouvé.")
     *         )
     *     ),
     *     @OA\Response(response=422, description="Données invalides"),
     *     @OA\Response(
     *         response=500,
     *         description="Erreur serveur",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Une erreur est survenue lors de la mise à jour du type de document.")
     *         )
     *     ),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
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
                'data'    => $typeDocument,
            ], 200);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la mise à jour d\'un type de document.', [
                'error'            => $e->getMessage(),
                'trace'            => $e->getTraceAsString(),
                'type_document_id' => $id,
                'request_data'     => $request->all(),
            ]);

            return response()->json([
                'message' => 'Une erreur est survenue lors de la mise à jour du type de document.',
            ], 500);
        }
    }

    /**
     * Supprimer un type de document.
     *
     * @OA\Delete(
     *     path="/api/type-documents/{id}",
     *     summary="Supprimer un type de document",
     *     tags={"Types de documents"},
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID du type de document",
     *         @OA\Schema(type="integer", example=1)
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Type de document supprimé avec succès",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Type de document supprimé avec succès.")
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Type de document non trouvé",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Type de document non trouvé.")
     *         )
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Erreur serveur",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Une erreur est survenue lors de la suppression du type de document.")
     *         )
     *     ),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
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
                'error'            => $e->getMessage(),
                'trace'            => $e->getTraceAsString(),
                'type_document_id' => $id,
            ]);

            return response()->json([
                'message' => 'Une erreur est survenue lors de la suppression du type de document.',
            ], 500);
        }
    }
}