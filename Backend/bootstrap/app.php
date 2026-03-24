<?php

use App\Http\Middleware\CollectMetrics;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Le chemin complet correct incluant le dossier Http
        $middleware->append(CollectMetrics::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
