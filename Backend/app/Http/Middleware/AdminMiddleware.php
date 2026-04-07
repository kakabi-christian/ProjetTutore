<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    /**
     * Gère la restriction d'accès aux administrateurs uniquement.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // 1. On récupère l'utilisateur connecté via le Token Sanctum
        $user = $request->user();

        // 2. On vérifie s'il existe et si son champ 'type' est exactement 'admin'
        if ($user && $user->type === 'admin') {
            return $next($request);
        }

        // 3. Sinon, on bloque avec une 403 propre pour ton front-end React
        return response()->json([
            'status' => 'error',
            'message' => 'Accès refusé. Vous devez être administrateur pour effectuer cette action.',
            'debug_user_type' => $user ? $user->type : 'guest',
        ], 403);
    }
}
