<?php

use App\Http\Middleware\AdminMiddleware;
use App\Http\Middleware\CollectMetrics; // On utilise celui qui existe dans ton dossier
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\HandleCors;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Ajouter CORS pour toutes les routes API
        $middleware->api(prepend: [
            HandleCors::class,
        ]);

        // Le chemin complet correct incluant le dossier Http
        $middleware->append(CollectMetrics::class);

        $middleware->alias([
            'is_admin' => AdminMiddleware::class,
        ]);

    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
