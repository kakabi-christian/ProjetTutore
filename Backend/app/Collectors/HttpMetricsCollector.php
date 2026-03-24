<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Spatie\Prometheus\Facades\Prometheus;
use Spatie\Prometheus\MetricTypes\Gauge;
use Symfony\Component\HttpFoundation\Response;

class CollectMetrics
{
    public function handle(Request $request, Closure $next): Response
    {
        $start = microtime(true);
        $response = $next($request);
        $duration = (float) (microtime(true) - $start);

        // On crée la métrique
        $gauge = new Gauge('http_request_duration_seconds', $duration);

        // IMPORTANT : On l'enregistre
        Prometheus::registerCollector($gauge);

        return $response;
    }
}
