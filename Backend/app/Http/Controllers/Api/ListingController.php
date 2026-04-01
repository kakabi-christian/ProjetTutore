<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kyc;
use App\Models\Listing;
use App\Models\ListingHistory;
use App\Models\ListingStatus;
use App\Models\Utilisateur;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ListingController extends Controller
{
    /**
     * @OA\Get(
     *      path="/listings",
     *      summary="Liste des annonces",
     *      tags={"Listings"},
     *      @OA\Parameter(name="currency_from", in="query", required=false, @OA\Schema(type="string")),
     *      @OA\Parameter(name="currency_to", in="query", required=false, @OA\Schema(type="string")),
     *      @OA\Parameter(name="min_amount", in="query", required=false, @OA\Schema(type="number")),
     *      @OA\Parameter(name="sort_by", in="query", required=false, @OA\Schema(type="string", enum={"exchange_rate", "amount_available", "created_at"})),
     *      @OA\Parameter(name="sort_order", in="query", required=false, @OA\Schema(type="string", enum={"asc", "desc"})),
     *      @OA\Response(response=200, description="Liste des annonces")
     * )
     *
     * Liste des annonces
     */
    public function index(Request $request)
    {
        // On construit la requête pour récupérer uniquement les annonces actives
        // Une annonce est "active" si son statut le plus récent dans l'historique est 'active'
        $query = Listing::whereHas('histories', function ($q) {
            $q->whereHas('listingStatus', function ($statusQuery) {
                $statusQuery->where('title', 'active');
            })->whereIn('listing_history_id', function ($sub) {
                // S'assurer que c'est bien la dernière entrée d'historique
                $sub->selectRaw('MAX(listing_history_id)')
                    ->from('listing_histories')
                    ->whereColumn('listing_id', 'listings.listing_id');
            });
        })->where('amount_available', '>', 0)
            ->with(['utilisateur:user_id,nom,prenom,email,pseudonyme', 'histories' => function ($historyQuery) {
                $historyQuery->latest('date')->take(1)->with('listingStatus');
            }]);

        // Filtrage
        if ($request->has('currency_from')) {
            $query->where('currency_from', strtoupper($request->currency_from));
        }

        if ($request->has('currency_to')) {
            $query->where('currency_to', strtoupper($request->currency_to));
        }

        if ($request->has('min_amount')) {
            $query->where('amount_available', '>=', $request->min_amount);
        }

        // Tri
        $sort_by = $request->get('sort_by', 'created_at'); // default sort
        $sort_order = $request->get('sort_order', 'desc');

        $allowed_sorts = ['exchange_rate', 'amount_available', 'created_at'];
        if (in_array($sort_by, $allowed_sorts)) {
            $query->orderBy($sort_by, $sort_order);
        }

        $listings = $query->paginate(15);

        return response()->json($listings);
    }

    /**
     * @OA\Get(
     *      path="/listings/{id}",
     *      summary="Afficher une annonce",
     *      tags={"Listings"},
     *      @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *      @OA\Response(response=200, description="Détail de l'annonce"),
     *      @OA\Response(response=404, description="Annonce introuvable")
     * )
     *
     * Afficher une annonce
     */
    public function show($id)
    {
        $listing = Listing::with(['utilisateur:user_id,nom,prenom,email,pseudonyme', 'reviews', 'histories.listingStatus'])
            ->findOrFail($id);

        return response()->json($listing);
    }

    /**
     * @OA\Post(
     *      path="/listings",
     *      summary="Publier une nouvelle annonce",
     *      tags={"Listings"},
     *      security={{"bearerAuth":{}}},
     *      @OA\RequestBody(
     *          required=true,
     *          @OA\JsonContent(
     *              required={"currency_from", "currency_to", "amount_available", "exchange_rate"},
     *              @OA\Property(property="currency_from", type="string", example="USD"),
     *              @OA\Property(property="currency_to", type="string", example="EUR"),
     *              @OA\Property(property="amount_available", type="number", example=100.50),
     *              @OA\Property(property="exchange_rate", type="number", example=0.92)
     *          )
     *      ),
     *      @OA\Response(response=201, description="Annonce créée avec succès"),
     *      @OA\Response(response=403, description="KYC requis")
     * )
     *
     * Publier une nouvelle annonce
     */
    public function store(Request $request)
    {
        /**
         * L'authentification par défaut de Laravel/Sanctum (Auth::user()) retourne généralement le modèle natif App\Models\User
         * mais ici nous utilisons le modèle Utilisateur.
         */

        /** @var Utilisateur $utilisateur */
        $utilisateur = Utilisateur::find(Auth::id());

        // Vérification KYC
        $kyc = Kyc::where('user_id', $utilisateur->user_id)
            ->where('status', 'APPROVED')
            ->first();

        if (! $kyc) {
            return response()->json(['message' => 'Un KYC approuvé est obligatoire pour créer une annonce.'], 403);
        }

        // Validation des donnees
        $validatedData = $request->validate([
            'currency_from' => 'required|string|max:10',
            'currency_to' => 'required|string|max:10',
            'amount_available' => 'required|numeric|min:0.01',
            'exchange_rate' => 'required|numeric|min:0.000001',
        ]);

        $validatedData['user_id'] = $utilisateur->user_id;

        // Creation du listing
        $listing = Listing::create($validatedData);

        // Recherche du statut 'active'
        $activeStatus = ListingStatus::firstOrCreate(
            ['title' => 'active']
        );

        // Creation de l'historique
        ListingHistory::create([
            'listing_id' => $listing->listing_id,
            'listing_status_id' => $activeStatus->listing_status_id,
            'date' => now(),
        ]);

        return response()->json([
            'message' => 'Annonce créée avec succès',
            'listing' => $listing->load('histories.listingStatus'),
        ], 201);
    }

    /**
     * @OA\Put(
     *      path="/listings/{id}",
     *      summary="Modifier une annonce",
     *      tags={"Listings"},
     *      security={{"bearerAuth":{}}},
     *      @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *      @OA\RequestBody(
     *          required=true,
     *          @OA\JsonContent(
     *              @OA\Property(property="currency_from", type="string", example="USD"),
     *              @OA\Property(property="currency_to", type="string", example="EUR"),
     *              @OA\Property(property="amount_available", type="number", example=150.0),
     *              @OA\Property(property="exchange_rate", type="number", example=0.95)
     *          )
     *      ),
     *      @OA\Response(response=200, description="Annonce mise à jour"),
     *      @OA\Response(response=403, description="Non autorisé")
     * )
     *
     * Modifier une annonce
     */
    public function update(Request $request, $id)
    {
        $listing = Listing::findOrFail($id);

        /**
         * L'authentification par défaut de Laravel/Sanctum (Auth::user()) retourne généralement le modèle natif App\Models\User
         * mais ici nous utilisons le modèle Utilisateur.
         */

        /** @var Utilisateur $utilisateur */
        $utilisateur = Utilisateur::find(Auth::id());

        // Droits : créateur ou admin
        if ($listing->user_id !== $utilisateur->user_id && ! $utilisateur->hasRole('admin')) {
            return response()->json(['message' => 'Non autorisé à modifier cette annonce.'], 403);
        }

        $validatedData = $request->validate([
            'currency_from' => 'sometimes|string|max:10',
            'currency_to' => 'sometimes|string|max:10',
            'amount_available' => 'sometimes|numeric|min:0',
            'exchange_rate' => 'sometimes|numeric|min:0.000001',
        ]);

        $listing->update($validatedData);

        // Enregistrer l'opération de modification dans l'historique en gardant le dernier statut existant
        $latestHistory = $listing->histories()->latest('date')->first();
        $statusId = $latestHistory ? $latestHistory->listing_status_id : null;

        ListingHistory::create([
            'listing_id' => $listing->listing_id,
            'listing_status_id' => $statusId,
            'date' => now(),
        ]);

        return response()->json([
            'message' => 'Annonce mise à jour avec succès',
            'listing' => $listing->load('histories.listingStatus'),
        ]);
    }

    /**
     * @OA\Delete(
     *      path="/listings/{id}",
     *      summary="Supprimer une annonce",
     *      tags={"Listings"},
     *      security={{"bearerAuth":{}}},
     *      @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *      @OA\Response(response=200, description="Annonce supprimée"),
     *      @OA\Response(response=403, description="Non autorisé"),
     *      @OA\Response(response=422, description="Transactions en cours")
     * )
     *
     * Supprimer une annonce
     */
    public function destroy($id)
    {
        $listing = Listing::findOrFail($id);

        /**
         * L'authentification par défaut de Laravel/Sanctum (Auth::user()) retourne généralement le modèle natif App\Models\User
         * mais ici nous utilisons le modèle Utilisateur.
         */

        /** @var Utilisateur $utilisateur */
        $utilisateur = Utilisateur::find(Auth::id());

        // Droits : créateur ou admin
        if ($listing->user_id !== $utilisateur->user_id && ! $utilisateur->hasRole('admin')) {
            return response()->json(['message' => 'Non autorisé à supprimer cette annonce.'], 403);
        }

        // Vérification des transactions en cours (PENDING)
        $hasPendingTransactions = $listing->transactions()->where('status', 'PENDING')->exists();

        if ($hasPendingTransactions) {
            return response()->json([
                'message' => 'Impossible de supprimer cette annonce car des transactions sont en cours dessus.',
            ], 422);
        }

        $listing->delete();

        return response()->json(['message' => 'Annonce supprimée avec succès']);
    }
}
