<?php

namespace App\Providers;

use App\Models\Feedback;
use App\Models\Utilisateur;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;
use Spatie\Prometheus\Facades\Prometheus;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Schema::defaultStringLength(191);

        // 1. Temps de réponse (via Cache)
        Prometheus::addGauge('http_request_duration_seconds')
            ->value(fn () => (float) cache('prometheus_metric_duration', 0));

        // 2. Compteur d'erreurs 500 (via Cache)
        Prometheus::addGauge('api_errors_total')
            ->value(fn () => (float) cache('prometheus_errors_count', 0));

        // 3. Nombre total d'utilisateurs (via Base de données)
        Prometheus::addGauge('total_users_count')
            ->value(fn () => (float) Utilisateur::count());

        // 4. Note moyenne des feedbacks (via Base de données)
        Prometheus::addGauge('average_feedback_note')
            ->value(fn () => (float) Feedback::avg('note') ?? 0);
    }
}
