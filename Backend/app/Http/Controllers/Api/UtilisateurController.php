<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UtilisateurRequest;
use App\Mail\AdminCreatedMail;
use App\Models\UserRole;
use App\Models\Utilisateur;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class UtilisateurController extends Controller
{
    /**
     * Génère un mot de passe aléatoire de 8 caractères.
     */
    private function generateRandomPassword(int $length = 8): string
    {
        return Str::random($length);
    }

    /**
     * Récupère les informations du profil de l'utilisateur connecté.
     */
    public function profile(): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'user' => Auth::user(),
        ], 200);
    }

    /**
     * 🛡️ ADMIN : Récupère la liste des administrateurs (Collaborateurs) avec pagination.
     */
    public function getAdminsList(Request $request): JsonResponse
    {
        try {
            $admins = Utilisateur::with('roles')
                ->where('type', 'admin')
                ->orderBy('created_at', 'desc')
                ->paginate($request->query('per_page', 10));

            return response()->json($admins, 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Erreur lors de la récupération des administrateurs',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 🛡️ ADMIN : Créer un nouveau collaborateur.
     */
    public function storeAdmin(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'lastname' => 'required|string|max:100',
            'firstname' => 'required|string|max:100',
            'email' => 'required|email|unique:utilisateurs,email',
            'telephone' => 'required|string|unique:utilisateurs,telephone',
            'country' => 'required|string',
            'role_id' => 'required|exists:roles,role_id',
        ]);

        try {
            return DB::transaction(function () use ($validated) {
                $plainPassword = $this->generateRandomPassword(8);

                $admin = Utilisateur::create([
                    'lastname' => $validated['lastname'],
                    'firstname' => $validated['firstname'],
                    'email' => $validated['email'],
                    'telephone' => $validated['telephone'],
                    'country' => $validated['country'],
                    'password' => Hash::make($plainPassword),
                    'type' => 'admin',
                    'isactive' => true,
                    'isverified' => true,
                ]);

                UserRole::create([
                    'user_id' => $admin->user_id,
                    'role_id' => $validated['role_id'],
                ]);

                Mail::to($admin->email)->send(new AdminCreatedMail($admin, $plainPassword));

                return response()->json([
                    'status' => 'success',
                    'message' => 'Administrateur créé avec succès. Un mail a été envoyé.',
                    'user' => $admin,
                ], 201);
            });
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Erreur lors de la création de l\'administrateur.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 🛡️ ADMIN : Modifier un collaborateur existant.
     */
    /**
     * 🛡️ ADMIN : Modifier un collaborateur existant.
     */
    public function updateAdmin(Request $request, $id): JsonResponse
    {
        Log::info("Tentative de mise à jour du collaborateur ID: $id", ['request_data' => $request->all()]);

        try {
            $admin = Utilisateur::where('type', 'admin')->findOrFail($id);

            $validated = $request->validate([
                'lastname' => 'required|string|max:100',
                'firstname' => 'required|string|max:100',
                'email' => 'required|email|unique:utilisateurs,email,'.$id.',user_id',
                'telephone' => 'required|string|unique:utilisateurs,telephone,'.$id.',user_id',
                'country' => 'required|string',
                'role_id' => 'required|exists:roles,role_id',
                'isactive' => 'required|boolean',
            ]);

            DB::transaction(function () use ($admin, $validated) {
                // Mise à jour des infos de base
                $admin->update([
                    'lastname' => $validated['lastname'],
                    'firstname' => $validated['firstname'],
                    'email' => $validated['email'],
                    'telephone' => $validated['telephone'],
                    'country' => $validated['country'],
                    'isactive' => $validated['isactive'],
                ]);

                // Mise à jour du rôle
                UserRole::where('user_id', $admin->user_id)->delete();
                UserRole::create([
                    'user_id' => $admin->user_id,
                    'role_id' => $validated['role_id'],
                ]);
            });

            Log::info("Collaborateur mis à jour avec succès ID: $id");

            return response()->json([
                'status' => 'success',
                'message' => 'Collaborateur mis à jour avec succès.',
                'user' => $admin->load('roles'),
            ], 200);

        } catch (ModelNotFoundException $e) {
            Log::warning("Échec update : Collaborateur ID $id introuvable ou n'est pas un admin.");

            return response()->json(['status' => 'error', 'message' => 'Collaborateur introuvable.'], 404);
        } catch (ValidationException $e) {
            Log::error("Erreur de validation lors de l'update ID $id", ['errors' => $e->errors()]);

            return response()->json(['status' => 'error', 'message' => 'Données invalides.', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error("Erreur critique lors de l'update ID $id", ['message' => $e->getMessage()]);

            return response()->json([
                'status' => 'error',
                'message' => 'Erreur lors de la mise à jour.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 🛡️ ADMIN : Supprimer un collaborateur.
     */
    public function destroyAdmin($id): JsonResponse
    {
        Log::info("Tentative de suppression du collaborateur ID: $id", ['admin_executant' => Auth::id()]);

        try {
            $admin = Utilisateur::where('type', 'admin')->findOrFail($id);

            if ($admin->user_id === Auth::id()) {
                Log::warning("Tentative d'auto-suppression bloquée pour l'ID: $id");

                return response()->json([
                    'status' => 'error',
                    'message' => 'Vous ne pouvez pas supprimer votre propre compte.',
                ], 403);
            }

            $admin->delete();

            Log::info("Collaborateur supprimé avec succès ID: $id");

            return response()->json([
                'status' => 'success',
                'message' => 'Collaborateur supprimé avec succès.',
            ], 200);

        } catch (ModelNotFoundException $e) {
            Log::warning("Échec suppression : Collaborateur ID $id introuvable.");

            return response()->json(['status' => 'error', 'message' => 'Collaborateur introuvable.'], 404);
        } catch (\Exception $e) {
            Log::error("Erreur lors de la suppression ID $id", ['message' => $e->getMessage()]);

            return response()->json([
                'status' => 'error',
                'message' => 'Erreur lors de la suppression.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Met à jour le profil de l'utilisateur connecté.
     */
    public function updateProfile(UtilisateurRequest $request): JsonResponse
    {
        /** @var Utilisateur $user */
        $user = Auth::user();

        $data = $request->safe()->only([
            'lastname', 'firstname', 'email', 'telephone', 'country',
        ]);

        $user->update($data);
        $user->refresh();

        return response()->json([
            'status' => 'success',
            'message' => 'Profil mis à jour avec succès.',
            'user' => $user,
        ], 200);
    }

    /**
     * Change le mot de passe de l'utilisateur connecté.
     */
    public function updatePassword(Request $request): JsonResponse
    {
        $request->validate([
            'old_password' => 'required',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        /** @var Utilisateur $user */
        $user = Auth::user();

        if (! Hash::check($request->old_password, $user->password)) {
            return response()->json([
                'status' => 'error',
                'message' => 'L\'ancien mot de passe est incorrect.',
            ], 422);
        }

        $user->update([
            'password' => Hash::make($request->new_password),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Mot de passe modifié avec succès.',
        ], 200);
    }

    /**
     * Récupère la liste des utilisateurs simples (type 'user').
     */
    public function getUsersList(): JsonResponse
    {
        try {
            $users = Utilisateur::select('user_id', 'firstname', 'lastname', 'email')
                ->where('type', 'user')
                ->where('isactive', true)
                ->orderBy('lastname', 'asc')
                ->get();

            return response()->json($users, 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la récupération des utilisateurs',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
