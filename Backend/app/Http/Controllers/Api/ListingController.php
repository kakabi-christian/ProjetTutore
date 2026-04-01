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
     * Liste des annonces actives globales avec Pagination.
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

            // Filtres de devises
            if ($request->filled('currency_from')) {
                $query->where('currency_from', strtoupper(substr($request->currency_from, 0, 3)));
            }

            if ($request->filled('currency_to')) {
                $query->where('currency_to', strtoupper(substr($request->currency_to, 0, 3)));
            }

            // Tri
            $sort_by = $request->get('sort_by', 'created_at');
            $sort_order = $request->get('sort_order', 'desc');
            $allowed_sorts = ['user_rate', 'amount_available', 'created_at'];

            if (in_array($sort_by, $allowed_sorts)) {
                $query->orderBy($sort_by, $sort_order);
            }

            $listings = $query->paginate(10);

            // Transformation des données pour inclure les accessors (discount)
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
     * Liste des annonces de l'utilisateur connecté avec Pagination.
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

            // On ajoute le pourcentage de réduction sur chaque annonce de l'utilisateur
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
     * Publier une nouvelle annonce.
     */
    public function store(ListingRequest $request)
    {
        /** @var Utilisateur $utilisateur */
        $utilisateur = Auth::user();

        // 1. Vérification KYC
        $isKycApproved = Kyc::where('user_id', $utilisateur->user_id)
            ->where('status', 'APPROVED')
            ->exists();

        if (!$isKycApproved) {
            return response()->json(['message' => 'Un KYC approuvé est obligatoire pour publier.'], 403);
        }

        $validatedData = $request->validated();
        $currencyFrom = strtoupper(substr($validatedData['currency_from'], 0, 3));
        $currencyTo = strtoupper(substr($validatedData['currency_to'], 0, 3));

        // 2. Récupération du taux officiel
        try {
            $officialRate = $this->exchangeRateService->getLiveRate($currencyFrom, $currencyTo);
            if (!$officialRate) {
                $officialRate = $validatedData['user_rate'];
            }
        } catch (\Exception $e) {
            Log::warning('[ExchaPay] API Taux indisponible, utilisation du taux utilisateur.');
            $officialRate = $validatedData['user_rate'];
        }

        // 3. Création de l'annonce
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

        // 4. Historique / Statut Initial
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
     * Détails d'une annonce.
     */
    public function show($id)
    {
        $listing = Listing::with(['utilisateur:user_id,lastname,firstname,email', 'reviews', 'histories.listingStatus'])
            ->findOrFail($id);
        
        $listing->append('discount_percentage');

        return response()->json($listing);
    }

    /**
     * Suppression (avec sécurité Escrow).
     */
    public function destroy($id)
    {
        $listing = Listing::findOrFail($id);
        $utilisateur = Auth::user();

        if ($listing->user_id !== $utilisateur->user_id && !$utilisateur->isAdmin()) {
            return response()->json(['message' => 'Action non autorisée.'], 403);
        }

        // Empêcher la suppression si une transaction est liée
        if ($listing->transactions()->exists()) {
            return response()->json(['message' => 'Impossible de supprimer une annonce liée à des transactions.'], 422);
        }

        $listing->delete();

        return response()->json(['message' => 'Annonce supprimée avec succès.']);
    }
}