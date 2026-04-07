<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Exception;

class FlutterwaveService
{
    protected $baseUrl;
    protected $secretKey;
    
    /**
     * Durée de conservation du cache en secondes (86400s = 24h)
     * Les banques et réseaux mobiles ne changent presque jamais.
     */
    protected $cacheDuration = 86400; 

    public function __construct()
    {
        $this->baseUrl = config('flutterwave.baseUrl');
        $this->secretKey = config('flutterwave.secretKey');

        Log::debug("FlutterwaveService: Initialisation du service", [
            'baseUrl' => $this->baseUrl,
            'secretKey_prefix' => substr($this->secretKey, 0, 12) . '...' 
        ]);
    }

    /**
     * Récupère les réseaux mobiles supportés par pays avec mise en cache
     */
    public function getMobileNetworks(string $countryCode)
    {
        $cacheKey = "flw_networks_" . strtolower($countryCode);

        return Cache::remember($cacheKey, $this->cacheDuration, function () use ($countryCode) {
            $url = "{$this->baseUrl}/mobile-networks";

            Log::info("FlutterwaveService@getMobileNetworks: Appel API (Cache manquant)", [
                'country' => $countryCode
            ]);

            try {
                $response = Http::withToken($this->secretKey)
                    ->withoutVerifying() 
                    ->timeout(30)
                    ->get($url, ['country' => $countryCode]);

                if ($response->failed()) {
                    Log::error("FlutterwaveService@getMobileNetworks: Échec API", [
                        'status' => $response->status(),
                        'body' => $response->json()
                    ]);
                    return null; 
                }

                $data = $response->json();
                
                // On s'assure que le succès est total avant de mettre en cache
                if (($data['status'] ?? '') !== 'success') {
                    return null;
                }

                return $data;

            } catch (Exception $e) {
                Log::emergency("FlutterwaveService@getMobileNetworks: CRASH", ['msg' => $e->getMessage()]);
                return null;
            }
        }) ?? ['status' => 'error', 'message' => 'Impossible de récupérer les réseaux mobiles'];
    }

    /**
     * Récupère la liste des banques par pays avec mise en cache
     */
    public function getBanks(string $countryCode)
    {
        $cacheKey = "flw_banks_" . strtolower($countryCode);

        return Cache::remember($cacheKey, $this->cacheDuration, function () use ($countryCode) {
            $url = "{$this->baseUrl}/banks/{$countryCode}";

            Log::info("FlutterwaveService@getBanks: Appel API (Cache manquant)", [
                'country' => $countryCode
            ]);

            try {
                $response = Http::withToken($this->secretKey)
                    ->withoutVerifying()
                    ->timeout(30)
                    ->get($url);

                if ($response->failed()) {
                    Log::error("FlutterwaveService@getBanks: Échec API", [
                        'status' => $response->status(),
                        'body' => $response->json()
                    ]);
                    return null;
                }

                $data = $response->json();

                if (($data['status'] ?? '') !== 'success') {
                    return null;
                }

                return $data;

            } catch (Exception $e) {
                Log::critical("FlutterwaveService@getBanks: Exception", ['msg' => $e->getMessage()]);
                return null;
            }
        }) ?? ['status' => 'error', 'message' => 'Impossible de récupérer la liste des banques'];
    }
}