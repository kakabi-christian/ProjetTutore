<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\RoleRequest;
use App\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * @OA\Tag(
 *     name="Rôles",
 *     description="Gestion des rôles"
 * )
 */
class RoleController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/roles",
     *     summary="Liste paginée des rôles",
     *     tags={"Rôles"},
     *     security={{"bearerAuth": {}}},
     *
     *     @OA\Parameter(
     *         name="per_page",
     *         in="query",
     *         required=false,
     *         description="Nombre d'éléments par page (défaut: 10)",
     *
     *         @OA\Schema(type="integer", default=10, example=10)
     *     ),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Liste des rôles récupérée avec succès",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(property="status", type="string", example="success"),
     *             @OA\Property(
     *                 property="data",
     *                 type="object",
     *                 @OA\Property(property="current_page", type="integer", example=1),
     *                 @OA\Property(
     *                     property="data",
     *                     type="array",
     *
     *                     @OA\Items(ref="#/components/schemas/Role")
     *                 ),
     *
     *                 @OA\Property(property="total", type="integer", example=50),
     *                 @OA\Property(property="per_page", type="integer", example=10),
     *                 @OA\Property(property="last_page", type="integer", example=5)
     *             )
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = $request->query('per_page', 10);
        $roles = Role::orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json([
            'status' => 'success',
            'data' => $roles,
        ], 200);
    }

    /**
     * @OA\Post(
     *     path="/api/roles",
     *     summary="Créer un nouveau rôle",
     *     tags={"Rôles"},
     *     security={{"bearerAuth": {}}},
     *
     *     @OA\RequestBody(
     *         required=true,
     *
     *         @OA\JsonContent(ref="#/components/schemas/Role")
     *     ),
     *
     *     @OA\Response(
     *         response=201,
     *         description="Rôle créé avec succès",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(property="status", type="string", example="success"),
     *             @OA\Property(property="message", type="string", example="Rôle créé avec succès."),
     *             @OA\Property(property="data", ref="#/components/schemas/Role")
     *         )
     *     ),
     *
     *     @OA\Response(response=422, description="Données invalides"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function store(RoleRequest $request): JsonResponse
    {
        $role = Role::create($request->validated());

        return response()->json([
            'status' => 'success',
            'message' => 'Rôle créé avec succès.',
            'data' => $role,
        ], 201);
    }

    /**
     * @OA\Get(
     *     path="/api/roles/{id}",
     *     summary="Afficher un rôle spécifique",
     *     tags={"Rôles"},
     *     security={{"bearerAuth": {}}},
     *
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID du rôle",
     *
     *         @OA\Schema(type="integer", example=1)
     *     ),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Détails du rôle récupérés avec succès",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(property="status", type="string", example="success"),
     *             @OA\Property(property="data", ref="#/components/schemas/Role")
     *         )
     *     ),
     *
     *     @OA\Response(response=404, description="Rôle introuvable"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function show(Role $role): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'data' => $role,
        ], 200);
    }

    /**
     * @OA\Put(
     *     path="/api/roles/{id}",
     *     summary="Mettre à jour un rôle existant",
     *     tags={"Rôles"},
     *     security={{"bearerAuth": {}}},
     *
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID du rôle",
     *
     *         @OA\Schema(type="integer", example=1)
     *     ),
     *
     *     @OA\RequestBody(
     *         required=true,
     *
     *         @OA\JsonContent(ref="#/components/schemas/Role")
     *     ),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Rôle mis à jour avec succès",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(property="status", type="string", example="success"),
     *             @OA\Property(property="message", type="string", example="Rôle mis à jour avec succès."),
     *             @OA\Property(property="data", ref="#/components/schemas/Role")
     *         )
     *     ),
     *
     *     @OA\Response(response=404, description="Rôle introuvable"),
     *     @OA\Response(response=422, description="Données invalides"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function update(RoleRequest $request, Role $role): JsonResponse
    {
        $role->update($request->validated());

        return response()->json([
            'status' => 'success',
            'message' => 'Rôle mis à jour avec succès.',
            'data' => $role,
        ], 200);
    }

    /**
     * @OA\Delete(
     *     path="/api/roles/{id}",
     *     summary="Supprimer un rôle",
     *     tags={"Rôles"},
     *     security={{"bearerAuth": {}}},
     *
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID du rôle",
     *
     *         @OA\Schema(type="integer", example=1)
     *     ),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Rôle supprimé avec succès",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(property="status", type="string", example="success"),
     *             @OA\Property(property="message", type="string", example="Rôle supprimé avec succès.")
     *         )
     *     ),
     *
     *     @OA\Response(
     *         response=422,
     *         description="Suppression impossible — rôle attribué à des utilisateurs",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(property="status", type="string", example="error"),
     *             @OA\Property(property="message", type="string", example="Impossible de supprimer ce rôle car il est attribué à des utilisateurs.")
     *         )
     *     ),
     *
     *     @OA\Response(response=404, description="Rôle introuvable"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function destroy(Role $role): JsonResponse
    {
        if ($role->utilisateurs()->exists()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Impossible de supprimer ce rôle car il est attribué à des utilisateurs.',
            ], 422);
        }

        $role->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Rôle supprimé avec succès.',
        ], 200);
    }
}
