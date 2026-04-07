<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MethodPayment;
use App\Models\Utilisateur;
use App\Services\FlutterwaveService;
use App\Http\Requests\PaymentMethodRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class PaymentMethodController extends Controller
{
    protected $flwService;

    public function __construct(FlutterwaveService $flwService)
    {
        $this->flwService = $flwService;
    }

    /**
     * Liste les méthodes de paiement enregistrées de l'utilisateur.
     */
    public function index(Request $request)
    {
        /** @var Utilisateur $user */
        $user = Auth::user();

        Log::info("PaymentMethodController@index: Récupération des méthodes", [
            'user_id' => $user->user_id
        ]);

        $perPage = $request->query('per_page', 10);

        $methods = $user->methodPayments()
            ->latest()
            ->paginate($perPage);

        return response()->json([
            'status' => 'success',
            'data' => $methods->items(),
            'meta' => [
                'current_page' => $methods->currentPage(),
                'last_page'    => $methods->lastPage(),
                'total'        => $methods->total(),
            ]
        ]);
    }

    /**
     * Récupère les réseaux mobiles et banques réels via Flutterwave.
     */
    public function availableMethods(Request $request)
    {
        /** @var Utilisateur $user */
        $user = Auth::user();

        // Détection du code pays : priorité au paramètre, puis profil, sinon CM par défaut
        $countryCode = $request->query('country_code') ?? $user->country_code ?? 'CM';

        // Nettoyage si le nom complet est envoyé au lieu du code ISO
        if (strtolower($countryCode) === 'cameroun') {
            $countryCode = 'CM';
        }

        Log::info("PaymentMethodController@availableMethods: Demande de données réelles", [
            'country' => $countryCode
        ]);

        // Appels réels au service
        $networks = $this->flwService->getMobileNetworks($countryCode);
        $banks = $this->flwService->getBanks($countryCode);

        // On ne retourne QUE ce que l'API renvoie réellement
        $mobileNetworksData = $networks['data'] ?? [];
        $banksData = $banks['data'] ?? [];

        Log::debug("PaymentMethodController: Données Flutterwave reçues", [
            'networks_found' => count($mobileNetworksData),
            'banks_found' => count($banksData)
        ]);

        return response()->json([
            'status' => 'success',
            'country_detected' => $countryCode,
            'mobile_networks' => $mobileNetworksData,
            'banks' => $banksData
        ]);
    }

    /**
     * Enregistre un nouveau mode de paiement.
     */
    public function store(PaymentMethodRequest $request)
    {
        /** @var Utilisateur $user */
        $user = Auth::user();

        try {
            $validated = $request->validated();
            $validated['user_id'] = $user->user_id;

            // Définit par défaut si c'est la toute première méthode de l'utilisateur
            $validated['is_default'] = !$user->methodPayments()->exists();

            $method = MethodPayment::create($validated);

            Log::info("PaymentMethodController@store: Nouveau mode enregistré", [
                'id' => $method->id,
                'user' => $user->user_id
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Mode de paiement ajouté avec succès',
                'data' => $method
            ], 201);

        } catch (\Exception $e) {
            Log::error("PaymentMethodController@store: Erreur insertion", ['msg' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur lors de l\'enregistrement local'], 500);
        }
    }

    /**
     * Supprime une méthode de paiement.
     */
    public function destroy(MethodPayment $methodPayment)
    {
        /** @var Utilisateur $user */
        $user = Auth::user();

        if ($methodPayment->user_id !== $user->user_id) {
            return response()->json(['message' => 'Action non autorisée'], 403);
        }

        $methodPayment->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Méthode supprimée'
        ]);
    }
}