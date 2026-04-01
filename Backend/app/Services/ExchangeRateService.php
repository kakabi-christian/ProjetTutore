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
        $this->apiKey = env('MASSIVE_API_KEY', 's9y6ojWFpCZ6fRO0XLly7CaZA7wnEbe0');
        $this->baseUrl = rtrim(env('MASSIVE_API_URL', 'https://api.massive.com/v3'), '/');
    }

    public function getLiveRate(string $from, string $to)
    {
        try {
            // Construction du ticker type "C:USDXAF" pour le Forex chez Massive
            $ticker = "C:" . strtoupper($from) . strtoupper($to);

            $response = Http::withoutVerifying()
                ->timeout(10) // Évite le 502 en coupant la connexion si l'API est lente
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $this->apiKey,
                    'Accept' => 'application/json',
                ])
                ->get("{$this->baseUrl}/market/forex/rate", [
                    'ticker' => $ticker
                ]);

            if ($response->successful()) {
                $data = $response->json();
                
                // Selon leur doc: les résultats sont souvent dans 'results'
                if (isset($data['results']['rate'])) {
                    return $data['results']['rate'];
                }
                
                // Fallback si la structure est différente
                return $data['rate'] ?? ($data['results'][0]['rate'] ?? null);
            }

            Log::error("Massive API Error [{$response->status()}]: " . $response->body());
            
            // --- SOLUTION DE SECOURS (IMPORTANT) ---
            // Si l'API Massive échoue (404), on utilise une API de secours gratuite
            return $this->getFallbackRate($from, $to);

        } catch (\Exception $e) {
            Log::error("ExchangeRateService Exception: " . $e->getMessage());
            return $this->getFallbackRate($from, $to);
        }
    }

    /**
     * API de secours au cas où Massive est en maintenance ou renvoie 404
     */
    private function getFallbackRate($from, $to)
    {
        try {
            $backup = Http::withoutVerifying()->get("https://open.er-api.com/v6/latest/{$from}");
            if ($backup->successful()) {
                return $backup->json()['rates'][strtoupper($to)] ?? null;
            }
        } catch (\Exception $e) {
            return null;
        }
        return null;
    }

    public function convert(float $amount, float $rate): float
    {
        return round($amount * $rate, 2);
    }
}