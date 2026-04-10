<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ListingRequest;
use App\Models\Kyc;
use App\Models\Listing;
use App\Models\ListingHistory;
use App\Models\ListingStatus;
use App\Models\Utilisateur;
use App\Services\ExchangeRateService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class ListingController extends Controller
{
    protected $exchangeRateService;

    public function __construct(ExchangeRateService $exchangeRateService)
    {
        $this->exchangeRateService = $exchangeRateService;
    }

    /**
     * @OA\Get(
     * path="/listings",
     * summary="Liste des annonces actives globales.",
     * tags={"Listings"},
     *
     * @OA\Response(response=200, description="Liste des annonces")
     * )
     */
    public function index(Request $request)
    {
        try {
            // On commence par charger les relations nécessaires
            $query = Listing::with([
                'utilisateur:user_id,lastname,firstname,email',
                'paymentMethod:method_payment_id,type,provider,currency',
            ])->where('amount_available', '>', 0);

            // FILTRE DE STATUT SIMPLIFIÉ
            // Au lieu de la sous-requête complexe, on vérifie simplement s'il existe un historique "active"
            // (Assure-toi que la relation 'histories' existe dans ton modèle Listing)
            $query->whereHas('histories.listingStatus', function ($q) {
                $q->where('title', 'active');
            });

            // Filtres de devises
            if ($request->filled('currency_from')) {
                $query->where('currency_from', strtoupper($request->currency_from));
            }

            if ($request->filled('currency_to')) {
                $query->where('currency_to', strtoupper($request->currency_to));
            }

            // Tri sécurisé
            $sort_by = $request->get('sort_by', 'created_at');
            $sort_order = $request->get('sort_order', 'desc');
            $allowed_sorts = ['user_rate', 'amount_available', 'created_at'];

            if (in_array($sort_by, $allowed_sorts)) {
                $query->orderBy($sort_by, $sort_order);
            }

            $listings = $query->paginate(10);

            // Ajout de l'attribut calculé pour le frontend
            $listings->getCollection()->each(function ($listing) {
                $listing->append('discount_percentage');
            });

            return response()->json($listings);

        } catch (\Exception $e) {
            Log::error('[ExchaPay] Erreur ListingController@index : '.$e->getMessage());

            // Retourne l'erreur réelle en mode debug pour t'aider
            return response()->json([
                'message' => 'Erreur lors du chargement.',
                'debug' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * @OA\Post(
     * path="/listings",
     * summary="Publier une nouvelle annonce.",
     * tags={"Listings"},
     * security={{"bearerAuth":{}}},
     *
     * @OA\RequestBody(
     * required=true,
     *
     * @OA\JsonContent(
     * required={"method_payment_id", "currency_from", "currency_to", "amount_available", "user_rate"},
     *
     * @OA\Property(property="method_payment_id", type="integer", example=1),
     * @OA\Property(property="currency_from", type="string", example="XAF"),
     * @OA\Property(property="currency_to", type="string", example="EUR"),
     * @OA\Property(property="amount_available", type="number", example=50000),
     * @OA\Property(property="user_rate", type="number", example=655.95)
     * )
     * )
     * )
     */
    public function store(ListingRequest $request)
    {
        /** @var Utilisateur $utilisateur */
        $utilisateur = Auth::user();

        // Vérification KYC
        $isKycApproved = Kyc::where('user_id', $utilisateur->user_id)
            ->where('status', 'APPROVED')
            ->exists();

        if (! $isKycApproved) {
            return response()->json(['message' => 'Un KYC approuvé est obligatoire pour publier.'], 403);
        }

        $validatedData = $request->validated();

        // Récupération du taux officiel
        try {
            $officialRate = $this->exchangeRateService->getLiveRate(
                $validatedData['currency_from'],
                $validatedData['currency_to']
            );
            if (! $officialRate) {
                $officialRate = $validatedData['user_rate'];
            }
        } catch (\Exception $e) {
            $officialRate = $validatedData['user_rate'];
        }

        $listing = Listing::create([
            'user_id' => $utilisateur->user_id,
            'method_payment_id' => $validatedData['method_payment_id'], // ✅ Nouveau
            'currency_from' => $validatedData['currency_from'],
            'currency_to' => $validatedData['currency_to'],
            'amount_available' => $validatedData['amount_available'],
            'min_amount' => $validatedData['min_amount'] ?? 0,
            'user_rate' => $validatedData['user_rate'],
            'official_rate' => $officialRate,
            'visual_theme' => $validatedData['visual_theme'] ?? 'default',
            'description' => $validatedData['description'] ?? null,
        ]);

        // Statut par défaut : Active
        $activeStatus = ListingStatus::firstOrCreate(['title' => 'active']);
        ListingHistory::create([
            'listing_id' => $listing->listing_id,
            'listing_status_id' => $activeStatus->listing_status_id,
            'date' => now(),
        ]);

        return response()->json([
            'message' => 'Annonce publiée avec succès',
            'listing' => $listing->load(['paymentMethod', 'histories.listingStatus']),
        ], 201);
    }

    /**
     * @OA\Get(
     * path="/listings/{id}",
     * summary="Détails d'une annonce.",
     * tags={"Listings"}
     * )
     */
    public function show($id)
    {
        $listing = Listing::with([
            'utilisateur:user_id,lastname,firstname,email',
            'paymentMethod',
            'reviews',
            'histories.listingStatus',
        ])->findOrFail($id);

        $listing->append('discount_percentage');

        return response()->json($listing);
    }

    /**
     * @OA\Get(
     * path="/listings/user",
     * summary="Liste des annonces de l'utilisateur connecté.",
     * tags={"Listings"},
     * security={{"bearerAuth":{}}}
     * )
     */
    public function userListings()
    {
        $user = Auth::user();
        $listings = Listing::where('user_id', $user->user_id)
            ->with(['paymentMethod', 'histories.listingStatus'])
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        $listings->getCollection()->each->append('discount_percentage');

        return response()->json($listings);
    }

    /**
     * @OA\Delete(
     * path="/listings/{id}",
     * summary="Suppression d'une annonce.",
     * tags={"Listings"},
     * security={{"bearerAuth":{}}}
     * )
     */
    public function destroy($id)
    {
        $listing = Listing::findOrFail($id);
        $utilisateur = Auth::user();

        // if ($listing->user_id !== $utilisateur->user_id && !$utilisateur->is_admin()) {
        //     return response()->json(['message' => 'Action non autorisée.'], 403);
        // }

        // Sécurité : On ne supprime pas si des transactions sont en cours (Escrow actif)
        if ($listing->transactions()->whereIn('status', ['pending', 'processing'])->exists()) {
            return response()->json([
                'message' => 'Impossible de supprimer une annonce liée à des transactions en cours.',
            ], 422);
        }

        $listing->delete();

        return response()->json(['message' => 'Annonce supprimée avec succès.']);
    }
}
