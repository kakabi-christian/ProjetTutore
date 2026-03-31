<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\RoleRequest;
use App\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoleController extends Controller
{
    /**
     * Affiche une liste paginée des rôles.
     */
    public function index(Request $request): JsonResponse
    {
        // On récupère le nombre d'éléments par page (par défaut 10)
        $perPage = $request->query('per_page', 10);

        $roles = Role::orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json([
            'status' => 'success',
            'data' => $roles,
        ], 200);
    }

    /**
     * Enregistre un nouveau rôle dans la base de données.
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
     * Affiche les détails d'un rôle spécifique.
     */
    public function show(Role $role): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'data' => $role,
        ], 200);
    }

    /**
     * Met à jour un rôle existant.
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
     * Supprime un rôle de la base de données.
     */
    public function destroy(Role $role): JsonResponse
    {
        // Optionnel : Vérifier si le rôle est utilisé avant de supprimer
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
