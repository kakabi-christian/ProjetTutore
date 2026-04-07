<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\RolePermissionRequest;
use App\Models\RolePermission;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

/**
 * @OA\Tag(
 *     name="Rôles & Permissions",
 *     description="Gestion de l'assignation des permissions aux rôles"
 * )
 */
class RolePermissionController extends Controller
{
    /**
     * Assigne des permissions à un rôle (Nettoie l'existant et remplace).
     * Cette méthode est appelée quand l'admin clique sur la "clé" dans le frontend.
     *
     * @OA\Post(
     *     path="/api/role-permissions",
     *     summary="Assigner des permissions à un rôle",
     *     description="Remplace toutes les permissions existantes du rôle par les nouvelles fournies (stratégie sync : supprime puis réinsère).",
     *     tags={"Rôles & Permissions"},
     *     security={{"bearerAuth": {}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"role_id", "permissions"},
     *             @OA\Property(
     *                 property="role_id",
     *                 type="integer",
     *                 description="ID du rôle cible",
     *                 example=2
     *             ),
     *             @OA\Property(
     *                 property="permissions",
     *                 type="array",
     *                 description="Liste des IDs de permissions à assigner",
     *                 @OA\Items(type="integer", example=5)
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Permissions assignées avec succès",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="message", type="string", example="Les permissions ont été assignées avec succès.")
     *         )
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Données invalides"
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Erreur serveur lors de la transaction",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(property="message", type="string", example="Erreur lors de l'assignation : ...")
     *         )
     *     ),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function assignPermissions(RolePermissionRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            // 1. Supprimer toutes les permissions actuelles de ce rôle spécifique
            RolePermission::where('role_id', $request->role_id)->delete();

            // 2. Préparer le tableau pour l'insertion de masse (Bulk Insert)
            $newPermissions = [];
            foreach ($request->permissions as $permissionId) {
                $newPermissions[] = [
                    'role_id'       => $request->role_id,
                    'permission_id' => $permissionId,
                    'created_at'    => now(),
                    'updated_at'    => now(),
                ];
            }

            // 3. Insérer les nouvelles permissions en une seule requête SQL
            if (! empty($newPermissions)) {
                RolePermission::insert($newPermissions);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Les permissions ont été assignées avec succès.',
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'assignation : '.$e->getMessage(),
            ], 500);
        }
    }
}