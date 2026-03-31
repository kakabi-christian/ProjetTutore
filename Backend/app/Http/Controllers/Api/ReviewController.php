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
     * Ajouter un nouvel avis à une annonce
     */
    public function store(Request $request, $listing_id)
    {
        $listing = Listing::findOrFail($listing_id);

        /** @var \App\Models\Utilisateur $utilisateur */
        $utilisateur = Utilisateur::find(Auth::id());

        // 1. Empêcher de s'auto-évaluer
        if ($listing->user_id === $utilisateur->user_id) {
            return response()->json([
                'message' => 'Vous ne pouvez pas laisser un avis sur votre propre annonce.'
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

        if (!$hasCompletedTransaction) {
            return response()->json([
                'message' => 'Vous devez avoir complété une transaction avec cet utilisateur pour laisser un avis.'
            ], 403);
        }

        // 3. Empêcher les avis en double (Optionnel mais recommandé)
        $existingReview = Review::where('listing_id', $listing->listing_id)
            ->where('reviewer_id', $utilisateur->user_id)
            ->first();

        if ($existingReview) {
            return response()->json([
                'message' => 'Vous avez déjà laissé un avis sur cette annonce.'
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
            'review' => $review->load('reviewer:user_id,nom,prenom,pseudonyme')
        ], 201);
    }

    /**
     * Modifier son avis
     */
    public function update(Request $request, $id)
    {
        $review = Review::findOrFail($id);
        
        /** @var \App\Models\Utilisateur $utilisateur */
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
            'review' => $review
        ]);
    }

    /**
     * Supprimer un avis (Auteur ou Admin)
     */
    public function destroy($id)
    {
        $review = Review::findOrFail($id);

        /** @var \App\Models\Utilisateur $utilisateur */
        $utilisateur = Utilisateur::find(Auth::id());

        // Vérification des droits
        if ($review->reviewer_id !== $utilisateur->user_id && !$utilisateur->hasRole('admin')) {
            return response()->json(['message' => 'Non autorisé à supprimer cet avis.'], 403);
        }

        $review->delete();

        return response()->json(['message' => 'Avis supprimé avec succès']);
    }
}
