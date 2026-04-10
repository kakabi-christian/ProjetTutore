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

/**
 * @OA\Tag(
 *     name="Utilisateurs",
 *     description="Gestion des utilisateurs et des collaborateurs"
 * )
 */
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
     *
     * @OA\Get(
     *     path="/api/utilisateurs/profile",
     *     summary="Profil de l'utilisateur connecté",
     *     tags={"Utilisateurs"},
     *     security={{"bearerAuth": {}}},
     *
     *     @OA\Response(
     *         response=200,
     *         description="Profil récupéré avec succès",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(property="status", type="string", example="success"),
     *             @OA\Property(property="user", ref="#/components/schemas/Utilisateur")
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Non authentifié")
     * )
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
     *
     * @OA\Get(
     *     path="/api/utilisateurs/admins",
     *     summary="Liste paginée des administrateurs (collaborateurs)",
     *     tags={"Utilisateurs"},
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
     *     @OA\Parameter(
     *         name="page",
     *         in="query",
     *         required=false,
     *         description="Numéro de la page",
     *
     *         @OA\Schema(type="integer", default=1, example=1)
     *     ),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Liste des administrateurs récupérée avec succès",
     *
     *         @OA\JsonContent(
     *             type="object",
     *
     *             @OA\Property(property="current_page", type="integer", example=1),
     *             @OA\Property(
     *                 property="data",
     *                 type="array",
     *
     *                 @OA\Items(ref="#/components/schemas/Utilisateur")
     *             ),
     *
     *             @OA\Property(property="total", type="integer", example=50),
     *             @OA\Property(property="per_page", type="integer", example=10),
     *             @OA\Property(property="last_page", type="integer", example=5)
     *         )
     *     ),
     *
     *     @OA\Response(
     *         response=500,
     *         description="Erreur serveur",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(property="status", type="string", example="error"),
     *             @OA\Property(property="message", type="string", example="Erreur lors de la récupération des administrateurs"),
     *             @OA\Property(property="error", type="string")
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Non authentifié")
     * )
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
     *
     * @OA\Post(
     *     path="/api/utilisateurs/admins",
     *     summary="Créer un nouveau collaborateur administrateur",
     *     description="Crée un compte admin, lui assigne un rôle et lui envoie ses identifiants par mail.",
     *     tags={"Utilisateurs"},
     *     security={{"bearerAuth": {}}},
     *
     *     @OA\RequestBody(
     *         required=true,
     *
     *         @OA\JsonContent(
     *             required={"lastname","firstname","email","telephone","country","role_id"},
     *
     *             @OA\Property(property="lastname", type="string", example="Dupont"),
     *             @OA\Property(property="firstname", type="string", example="Jean"),
     *             @OA\Property(property="email", type="string", format="email", example="jean.dupont@example.com"),
     *             @OA\Property(property="telephone", type="string", example="+33612345678"),
     *             @OA\Property(property="country", type="string", example="France"),
     *             @OA\Property(property="role_id", type="integer", example=2)
     *         )
     *     ),
     *
     *     @OA\Response(
     *         response=201,
     *         description="Administrateur créé avec succès",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(property="status", type="string", example="success"),
     *             @OA\Property(property="message", type="string", example="Administrateur créé avec succès. Un mail a été envoyé."),
     *             @OA\Property(property="user", ref="#/components/schemas/Utilisateur")
     *         )
     *     ),
     *
     *     @OA\Response(response=422, description="Données invalides"),
     *     @OA\Response(
     *         response=500,
     *         description="Erreur serveur",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(property="status", type="string", example="error"),
     *             @OA\Property(property="message", type="string", example="Erreur lors de la création de l'administrateur."),
     *             @OA\Property(property="error", type="string")
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Non authentifié")
     * )
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
     *
     * @OA\Put(
     *     path="/api/utilisateurs/admins/{id}",
     *     summary="Mettre à jour un collaborateur administrateur",
     *     tags={"Utilisateurs"},
     *     security={{"bearerAuth": {}}},
     *
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID du collaborateur",
     *
     *         @OA\Schema(type="integer", example=1)
     *     ),
     *
     *     @OA\RequestBody(
     *         required=true,
     *
     *         @OA\JsonContent(
     *             required={"lastname","firstname","email","telephone","country","role_id","isactive"},
     *
     *             @OA\Property(property="lastname", type="string", example="Dupont"),
     *             @OA\Property(property="firstname", type="string", example="Jean"),
     *             @OA\Property(property="email", type="string", format="email", example="jean.dupont@example.com"),
     *             @OA\Property(property="telephone", type="string", example="+33612345678"),
     *             @OA\Property(property="country", type="string", example="France"),
     *             @OA\Property(property="role_id", type="integer", example=2),
     *             @OA\Property(property="isactive", type="boolean", example=true)
     *         )
     *     ),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Collaborateur mis à jour avec succès",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(property="status", type="string", example="success"),
     *             @OA\Property(property="message", type="string", example="Collaborateur mis à jour avec succès."),
     *             @OA\Property(property="user", ref="#/components/schemas/Utilisateur")
     *         )
     *     ),
     *
     *     @OA\Response(
     *         response=404,
     *         description="Collaborateur introuvable",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(property="status", type="string", example="error"),
     *             @OA\Property(property="message", type="string", example="Collaborateur introuvable.")
     *         )
     *     ),
     *
     *     @OA\Response(
     *         response=422,
     *         description="Données invalides",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(property="status", type="string", example="error"),
     *             @OA\Property(property="message", type="string", example="Données invalides."),
     *             @OA\Property(property="errors", type="object")
     *         )
     *     ),
     *
     *     @OA\Response(
     *         response=500,
     *         description="Erreur serveur",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(property="status", type="string", example="error"),
     *             @OA\Property(property="message", type="string", example="Erreur lors de la mise à jour."),
     *             @OA\Property(property="error", type="string")
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Non authentifié")
     * )
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
     *
     * @OA\Delete(
     *     path="/api/utilisateurs/admins/{id}",
     *     summary="Supprimer un collaborateur administrateur",
     *     description="Un administrateur ne peut pas supprimer son propre compte.",
     *     tags={"Utilisateurs"},
     *     security={{"bearerAuth": {}}},
     *
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID du collaborateur à supprimer",
     *
     *         @OA\Schema(type="integer", example=1)
     *     ),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Collaborateur supprimé avec succès",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(property="status", type="string", example="success"),
     *             @OA\Property(property="message", type="string", example="Collaborateur supprimé avec succès.")
     *         )
     *     ),
     *
     *     @OA\Response(
     *         response=403,
     *         description="Auto-suppression interdite",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(property="status", type="string", example="error"),
     *             @OA\Property(property="message", type="string", example="Vous ne pouvez pas supprimer votre propre compte.")
     *         )
     *     ),
     *
     *     @OA\Response(
     *         response=404,
     *         description="Collaborateur introuvable",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(property="status", type="string", example="error"),
     *             @OA\Property(property="message", type="string", example="Collaborateur introuvable.")
     *         )
     *     ),
     *
     *     @OA\Response(
     *         response=500,
     *         description="Erreur serveur",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(property="status", type="string", example="error"),
     *             @OA\Property(property="message", type="string", example="Erreur lors de la suppression."),
     *             @OA\Property(property="error", type="string")
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Non authentifié")
     * )
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
     *
     * @OA\Put(
     *     path="/api/utilisateurs/profile",
     *     summary="Mettre à jour le profil de l'utilisateur connecté",
     *     tags={"Utilisateurs"},
     *     security={{"bearerAuth": {}}},
     *
     *     @OA\RequestBody(
     *         required=true,
     *
     *         @OA\JsonContent(
     *             required={"lastname","firstname","email","telephone","country"},
     *
     *             @OA\Property(property="lastname", type="string", example="Dupont"),
     *             @OA\Property(property="firstname", type="string", example="Jean"),
     *             @OA\Property(property="email", type="string", format="email", example="jean.dupont@example.com"),
     *             @OA\Property(property="telephone", type="string", example="+33612345678"),
     *             @OA\Property(property="country", type="string", example="France")
     *         )
     *     ),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Profil mis à jour avec succès",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(property="status", type="string", example="success"),
     *             @OA\Property(property="message", type="string", example="Profil mis à jour avec succès."),
     *             @OA\Property(property="user", ref="#/components/schemas/Utilisateur")
     *         )
     *     ),
     *
     *     @OA\Response(response=422, description="Données invalides"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
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
     *
     * @OA\Post(
     *     path="/api/utilisateurs/password",
     *     summary="Changer le mot de passe de l'utilisateur connecté",
     *     tags={"Utilisateurs"},
     *     security={{"bearerAuth": {}}},
     *
     *     @OA\RequestBody(
     *         required=true,
     *
     *         @OA\JsonContent(
     *             required={"old_password","new_password","new_password_confirmation"},
     *
     *             @OA\Property(property="old_password", type="string", format="password", example="ancienMotDePasse"),
     *             @OA\Property(property="new_password", type="string", format="password", example="nouveauMotDePasse1!"),
     *             @OA\Property(property="new_password_confirmation", type="string", format="password", example="nouveauMotDePasse1!")
     *         )
     *     ),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Mot de passe modifié avec succès",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(property="status", type="string", example="success"),
     *             @OA\Property(property="message", type="string", example="Mot de passe modifié avec succès.")
     *         )
     *     ),
     *
     *     @OA\Response(
     *         response=422,
     *         description="Ancien mot de passe incorrect ou données invalides",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(property="status", type="string", example="error"),
     *             @OA\Property(property="message", type="string", example="L'ancien mot de passe est incorrect.")
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Non authentifié")
     * )
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
     *
     * @OA\Get(
     *     path="/api/utilisateurs",
     *     summary="Liste des utilisateurs simples actifs",
     *     tags={"Utilisateurs"},
     *     security={{"bearerAuth": {}}},
     *
     *     @OA\Response(
     *         response=200,
     *         description="Liste récupérée avec succès",
     *
     *         @OA\JsonContent(
     *             type="array",
     *
     *             @OA\Items(
     *                 type="object",
     *
     *                 @OA\Property(property="user_id", type="integer", example=1),
     *                 @OA\Property(property="firstname", type="string", example="Jean"),
     *                 @OA\Property(property="lastname", type="string", example="Dupont"),
     *                 @OA\Property(property="email", type="string", format="email", example="jean.dupont@example.com")
     *             )
     *         )
     *     ),
     *
     *     @OA\Response(
     *         response=500,
     *         description="Erreur serveur",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(property="message", type="string", example="Erreur lors de la récupération des utilisateurs"),
     *             @OA\Property(property="error", type="string")
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Non authentifié")
     * )
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
