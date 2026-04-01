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
     * summary="Liste des annonces actives globales avec Pagination.",
     * tags={"Listings"},
     * @OA\Parameter(name="currency_from", in="query", required=false, @OA\Schema(type="string")),
     * @OA\Parameter(name="currency_to", in="query", required=false, @OA\Schema(type="string")),
     * @OA\Parameter(name="min_amount", in="query", required=false, @OA\Schema(type="number")),
     * @OA\Parameter(name="sort_by", in="query", required=false, @OA\Schema(type="string", enum={"user_rate", "amount_available", "created_at"})),
     * @OA\Parameter(name="sort_order", in="query", required=false, @OA\Schema(type="string", enum={"asc", "desc"})),
     * @OA\Response(response=200, description="Liste des annonces")
     * )
     */
    public function index(Request $request)
    {
        Log::info('[ExchaPay] --- Début de la requête index ---');

        try {
            $query = Listing::whereHas('histories', function ($q) {
                $q->whereHas('listingStatus', function ($statusQuery) {
                    $statusQuery->where('title', 'active');
                })->whereIn('listing_history_id', function ($sub) {
                    $sub->selectRaw('MAX(listing_history_id)')
                        ->from('listing_histories')
                        ->whereColumn('listing_id', 'listings.listing_id');
                });
            })->where('amount_available', '>', 0)
              ->with(['utilisateur:user_id,lastname,firstname,email']);

            if ($request->filled('currency_from')) {
                $query->where('currency_from', strtoupper(substr($request->currency_from, 0, 3)));
            }

            if ($request->filled('currency_to')) {
                $query->where('currency_to', strtoupper(substr($request->currency_to, 0, 3)));
            }

            $sort_by = $request->get('sort_by', 'created_at');
            $sort_order = $request->get('sort_order', 'desc');
            $allowed_sorts = ['user_rate', 'amount_available', 'created_at'];

            if (in_array($sort_by, $allowed_sorts)) {
                $query->orderBy($sort_by, $sort_order);
            }

            $listings = $query->paginate(10);

            $listings->getCollection()->transform(function ($listing) {
                $listing->append('discount_percentage');
                return $listing;
            });

            return response()->json($listings);

        } catch (\Exception $e) {
            Log::error('[ExchaPay] Erreur ListingController@index : ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur lors du chargement des annonces.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * @OA\Get(
     * path="/listings/user",
     * summary="Liste des annonces de l'utilisateur connecté avec Pagination.",
     * tags={"Listings"},
     * security={{"bearerAuth":{}}},
     * @OA\Response(response=200, description="Liste des annonces utilisateur")
     * )
     */
    public function userListings(Request $request)
    {
        try {
            /** @var Utilisateur $user */
            $user = Auth::user();

            $listings = Listing::where('user_id', $user->user_id)
                ->with(['histories.listingStatus'])
                ->orderBy('created_at', 'desc')
                ->paginate(10);

            $listings->getCollection()->transform(function ($listing) {
                $listing->append('discount_percentage');
                return $listing;
            });

            return response()->json($listings);
        } catch (\Exception $e) {
            Log::error('[ExchaPay] Erreur ListingController@userListings : ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur lors de la récupération de vos annonces.',
            ], 500);
        }
    }

    /**
     * @OA\Post(
     * path="/listings",
     * summary="Publier une nouvelle annonce.",
     * tags={"Listings"},
     * security={{"bearerAuth":{}}},
     * @OA\RequestBody(
     * required=true,
     * @OA\JsonContent(
     * required={"currency_from", "currency_to", "amount_available", "user_rate"},
     * @OA\Property(property="currency_from", type="string", example="USD"),
     * @OA\Property(property="currency_to", type="string", example="EUR"),
     * @OA\Property(property="amount_available", type="number", example=100.50),
     * @OA\Property(property="user_rate", type="number", example=0.92)
     * )
     * ),
     * @OA\Response(response=201, description="Annonce créée avec succès"),
     * @OA\Response(response=403, description="KYC requis")
     * )
     */
    public function store(ListingRequest $request)
    {
        /** @var Utilisateur $utilisateur */
        $utilisateur = Auth::user();

        $isKycApproved = Kyc::where('user_id', $utilisateur->user_id)
            ->where('status', 'APPROVED')
            ->exists();

        if (!$isKycApproved) {
            return response()->json(['message' => 'Un KYC approuvé est obligatoire pour publier.'], 403);
        }

        $validatedData = $request->validated();
        $currencyFrom = strtoupper(substr($validatedData['currency_from'], 0, 3));
        $currencyTo = strtoupper(substr($validatedData['currency_to'], 0, 3));

        try {
            $officialRate = $this->exchangeRateService->getLiveRate($currencyFrom, $currencyTo);
            if (!$officialRate) {
                $officialRate = $validatedData['user_rate'];
            }
        } catch (\Exception $e) {
            Log::warning('[ExchaPay] API Taux indisponible, utilisation du taux utilisateur.');
            $officialRate = $validatedData['user_rate'];
        }

        $listing = Listing::create([
            'user_id' => $utilisateur->user_id,
            'currency_from' => $currencyFrom,
            'currency_to' => $currencyTo,
            'amount_available' => $validatedData['amount_available'],
            'min_amount' => $validatedData['min_amount'] ?? 0,
            'user_rate' => $validatedData['user_rate'],
            'official_rate' => $officialRate,
            'visual_theme' => $validatedData['visual_theme'] ?? 'default',
            'description' => $validatedData['description'] ?? null,
        ]);

        $activeStatus = ListingStatus::firstOrCreate(['title' => 'active']);
        ListingHistory::create([
            'listing_id' => $listing->listing_id,
            'listing_status_id' => $activeStatus->listing_status_id,
            'date' => now(),
        ]);

        return response()->json([
            'message' => 'Annonce publiée avec succès',
            'listing' => $listing->load('histories.listingStatus'),
        ], 201);
    }

    /**
     * @OA\Get(
     * path="/listings/{id}",
     * summary="Détails d'une annonce.",
     * tags={"Listings"},
     * @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     * @OA\Response(response=200, description="Détail de l'annonce"),
     * @OA\Response(response=404, description="Annonce introuvable")
     * )
     */
    public function show($id)
    {
        $listing = Listing::with(['utilisateur:user_id,lastname,firstname,email', 'reviews', 'histories.listingStatus'])
            ->findOrFail($id);
        
        $listing->append('discount_percentage');

        return response()->json($listing);
    }

    /**
     * @OA\Delete(
     * path="/listings/{id}",
     * summary="Suppression (avec sécurité Escrow).",
     * tags={"Listings"},
     * security={{"bearerAuth":{}}},
     * @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     * @OA\Response(response=200, description="Annonce supprimée"),
     * @OA\Response(response=403, description="Non autorisé"),
     * @OA\Response(response=422, description="Transactions en cours")
     * )
     */
    public function destroy($id)
    {
        $listing = Listing::findOrFail($id);
        $utilisateur = Auth::user();

        if ($listing->user_id !== $utilisateur->user_id && !$utilisateur->isAdmin()) {
            return response()->json(['message' => 'Action non autorisée.'], 403);
        }

        if ($listing->transactions()->exists()) {
            return response()->json(['message' => 'Impossible de supprimer une annonce liée à des transactions.'], 422);
        }

        $listing->delete();

        return response()->json(['message' => 'Annonce supprimée avec succès.']);
    }
}