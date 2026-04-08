<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Listing;
use App\Models\Review;
use App\Models\Transaction;
use App\Models\Utilisateur;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ReviewController extends Controller
{
    /**
     * @OA\Get(
     *      path="/reviews/{listing_id}",
     *      summary="Liste les avis pour une annonce spécifique",
     *      tags={"Reviews"},
     *
     *      @OA\Parameter(
     *          name="listing_id",
     *          in="path",
     *          required=true,
     *          description="ID de l'annonce",
     *
     *          @OA\Schema(type="integer")
     *      ),
     *
     *      @OA\Response(
     *          response=200,
     *          description="Liste des avis"
     *      )
     * )
     *
     * Liste les avis pour une annonce spécifique
     */
    public function index($listing_id)
    {
        // On vérifie que l'annonce existe
        $listing = Listing::findOrFail($listing_id);

        // On récupère les avis avec les infos du reviewer
        $reviews = Review::where('listing_id', $listing->listing_id)
            ->with('reviewer:user_id,nom,prenom,pseudonyme')
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json($reviews);
    }

    /**
     * @OA\Post(
     *      path="/listings/{listing_id}/reviews",
     *      summary="Ajouter un nouvel avis à une annonce",
     *      tags={"Reviews"},
     *      security={{"bearerAuth":{}}},
     *
     *      @OA\Parameter(name="listing_id", in="path", required=true, @OA\Schema(type="integer")),
     *
     *      @OA\RequestBody(
     *          required=true,
     *
     *          @OA\JsonContent(
     *              required={"rating"},
     *
     *              @OA\Property(property="rating", type="integer", example=5),
     *              @OA\Property(property="comment", type="string", example="Très bon échange")
     *          )
     *      ),
     *
     *      @OA\Response(response=201, description="Avis ajouté avec succès"),
     *      @OA\Response(response=403, description="Interdit (auto-évaluation ou pas de transaction)")
     * )
     *
     * Ajouter un nouvel avis à une annonce
     */
    public function store(Request $request, $listing_id)
    {
        $listing = Listing::findOrFail($listing_id);

        /** @var Utilisateur $utilisateur */
        $utilisateur = Utilisateur::find(Auth::id());

        // 1. Empêcher de s'auto-évaluer
        if ($listing->user_id === $utilisateur->user_id) {
            return response()->json([
                'message' => 'Vous ne pouvez pas laisser un avis sur votre propre annonce.',
            ], 403);
        }

        // 2. Vérifier que l'utilisateur a bien une transaction "COMPLETED" sur cette annonce
        $hasCompletedTransaction = Transaction::where('listing_id', $listing->listing_id)
            ->where(function ($query) use ($utilisateur) {
                $query->where('buyer_id', $utilisateur->user_id)
                    ->orWhere('seller_id', $utilisateur->user_id);
            })
            ->where('status', 'COMPLETED')
            ->exists();

        if (! $hasCompletedTransaction) {
            return response()->json([
                'message' => 'Vous devez avoir complété une transaction avec cet utilisateur pour laisser un avis.',
            ], 403);
        }

        // 3. Empêcher les avis en double (Optionnel mais recommandé)
        $existingReview = Review::where('listing_id', $listing->listing_id)
            ->where('reviewer_id', $utilisateur->user_id)
            ->first();

        if ($existingReview) {
            return response()->json([
                'message' => 'Vous avez déjà laissé un avis sur cette annonce.',
            ], 409);
        }

        // 4. Validation et création
        $validatedData = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        $review = Review::create([
            'reviewer_id' => $utilisateur->user_id,
            'listing_id' => $listing->listing_id,
            'rating' => $validatedData['rating'],
            'comment' => $validatedData['comment'] ?? null,
        ]);

        return response()->json([
            'message' => 'Avis ajouté avec succès',
            'review' => $review->load('reviewer:user_id,nom,prenom,pseudonyme'),
        ], 201);
    }

    /**
     * @OA\Put(
     *      path="/reviews/{id}",
     *      summary="Modifier son avis",
     *      tags={"Reviews"},
     *      security={{"bearerAuth":{}}},
     *
     *      @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *
     *      @OA\RequestBody(
     *          required=true,
     *
     *          @OA\JsonContent(
     *
     *              @OA\Property(property="rating", type="integer", example=4),
     *              @OA\Property(property="comment", type="string", example="Un peu lent mais correct")
     *          )
     *      ),
     *
     *      @OA\Response(response=200, description="Avis mis à jour avec succès"),
     *      @OA\Response(response=403, description="Non autorisé")
     * )
     *
     * Modifier son avis
     */
    public function update(Request $request, $id)
    {
        $review = Review::findOrFail($id);

        /** @var Utilisateur $utilisateur */
        $utilisateur = Utilisateur::find(Auth::id());

        // Seul le créateur de l'avis peut le modifier
        if ($review->reviewer_id !== $utilisateur->user_id) {
            return response()->json(['message' => 'Non autorisé à modifier cet avis.'], 403);
        }

        $validatedData = $request->validate([
            'rating' => 'sometimes|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        $review->update($validatedData);

        return response()->json([
            'message' => 'Avis mis à jour avec succès',
            'review' => $review,
        ]);
    }

    /**
     * @OA\Delete(
     *      path="/reviews/{id}",
     *      summary="Supprimer un avis (Auteur ou Admin)",
     *      tags={"Reviews"},
     *      security={{"bearerAuth":{}}},
     *
     *      @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *
     *      @OA\Response(response=200, description="Avis supprimé avec succès"),
     *      @OA\Response(response=403, description="Non autorisé")
     * )
     *
     * Supprimer un avis (Auteur ou Admin)
     */
    public function destroy($id)
    {
        $review = Review::findOrFail($id);

        /** @var Utilisateur $utilisateur */
        $utilisateur = Utilisateur::find(Auth::id());

        // Vérification des droits
        if ($review->reviewer_id !== $utilisateur->user_id && ! $utilisateur->hasRole('admin')) {
            return response()->json(['message' => 'Non autorisé à supprimer cet avis.'], 403);
        }

        $review->delete();

        return response()->json(['message' => 'Avis supprimé avec succès']);
    }
}
