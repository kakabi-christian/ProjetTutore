<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ExchangeRateService
{
    protected $apiKey;
    protected $baseUrl;

    public function __construct()
    {
        /** * SÉCURITÉ : On retire la clé en dur. 
         * La valeur doit être définie dans ton fichier .env sous MASSIVE_API_KEY.
         */
        $this->apiKey = env('MASSIVE_API_KEY');
        $this->baseUrl = rtrim(env('MASSIVE_API_URL', 'https://api.massive.com/v3'), '/');
    }

    /**
     * Récupère le taux de change en direct.
     * Ajout d'un type de retour ?float pour la clarté Sonar.
     */
    public function getLiveRate(string $from, string $to): ?float
    {
        $ticker = 'C:' . strtoupper($from) . strtoupper($to);

        try {
            $response = Http::withoutVerifying()
                ->timeout(10)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $this->apiKey,
                    'Accept' => 'application/json',
                ])
                ->get("{$this->baseUrl}/market/forex/rate", [
                    'ticker' => $ticker,
                ]);

            if ($response->successful()) {
                return $this->extractRateFromResponse($response->json());
            }

            Log::error("Massive API Error [{$response->status()}]: " . $response->body());

        } catch (\Exception $e) {
            Log::error('ExchangeRateService Exception: ' . $e->getMessage());
        }

        // --- SOLUTION DE SECOURS ---
        return $this->getFallbackRate($from, $to);
    }

    /**
     * Extrait le taux selon les différentes structures possibles de l'API.
     * Cette méthode privée réduit la complexité cognitive de getLiveRate.
     */
    private function extractRateFromResponse(array $data): ?float
    {
        if (isset($data['results']['rate'])) {
            return (float) $data['results']['rate'];
        }

        return (float) ($data['rate'] ?? ($data['results'][0]['rate'] ?? null));
    }

    /**
     * API de secours (open.er-api.com)
     */
    private function getFallbackRate(string $from, string $to): ?float
    {
        try {
            $backup = Http::withoutVerifying()
                ->timeout(5)
                ->get("https://open.er-api.com/v6/latest/{$from}");

            if ($backup->successful()) {
                $rates = $backup->json()['rates'] ?? [];
                return isset($rates[strtoupper($to)]) ? (float) $rates[strtoupper($to)] : null;
            }
        } catch (\Exception $e) {
            Log::warning('Fallback API failed: ' . $e->getMessage());
        }

        return null;
    }

    public function convert(float $amount, float $rate): float
    {
        return round($amount * $rate, 2);
    }
}