<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class CollectMetrics
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // 1. On démarre le chrono
        $start = microtime(true);

        $response = $next($request);

        // 2. On calcule la durée exacte
        $duration = (float) (microtime(true) - $start);

        try {
            // On ignore la propre route de prometheus pour ne pas fausser les stats
            if ($request->path() !== 'prometheus') {

                // --- PARTIE CHRONO ---
                // On dépose la durée dans le cache (la boîte aux lettres)
                Cache::put('prometheus_metric_duration', $duration, now()->addMinutes(10));

                // --- PARTIE TAUX D'ERREURS ---
                // Si la réponse est une erreur serveur (500, 503, etc.)
                if ($response->getStatusCode() >= 500) {
                    // On récupère le nombre actuel d'erreurs et on fait +1
                    $currentErrors = (int) Cache::get('prometheus_errors_count', 0);
                    Cache::put('prometheus_errors_count', $currentErrors + 1);

                    Log::warning('[Prometheus] Erreur 500 détectée sur '.$request->path());
                }

                Log::info("[Prometheus] Stats ExchaPay : {$duration}s | Status: ".$response->getStatusCode());
            }

        } catch (\Exception $e) {
            Log::error('[Prometheus] Erreur Middleware : '.$e->getMessage());
        }

        return $response;
    }
}
