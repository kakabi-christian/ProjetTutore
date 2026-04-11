<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PermissionController extends Controller
{
    /**
     * @OA\Get(
     *      path="/admin/permissions",
     *      summary="Liste des permissions avec pagination (Admin)",
     *      tags={"Permissions (Admin)"},
     *      security={{"bearerAuth":{}}},
     *
     *      @OA\Parameter(name="per_page", in="query", required=false, @OA\Schema(type="integer", default=10)),
     *
     *      @OA\Response(response=200, description="Liste des permissions récupérée")
     * )
     *
     * Affiche la liste des permissions avec pagination.
     * Utile pour que l'admin puisse les voir et les assigner.
     */
    public function index(Request $request): JsonResponse
    {
        // On récupère le nombre d'éléments par page (par défaut 10)
        $perPage = $request->get('per_page', 10);

        // Récupération des permissions triées par nom avec pagination
        $permissions = Permission::orderBy('name', 'asc')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $permissions->items(), // Les données de la page actuelle
            'pagination' => [
                'total' => $permissions->total(),
                'count' => $permissions->count(),
                'per_page' => $permissions->perPage(),
                'current_page' => $permissions->currentPage(),
                'total_pages' => $permissions->lastPage(),
            ],
        ], 200);
    }
}
