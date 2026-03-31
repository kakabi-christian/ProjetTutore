<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RolePermission;
use App\Http\Requests\RolePermissionRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class RolePermissionController extends Controller
{
    /**
     * Assigne des permissions à un rôle (Nettoie l'existant et remplace).
     * Cette méthode est appelée quand l'admin clique sur la "clé" dans le frontend.
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
            if (!empty($newPermissions)) {
                RolePermission::insert($newPermissions);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Les permissions ont été assignées avec succès.'
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'assignation : ' . $e->getMessage()
            ], 500);
        }
    }

}