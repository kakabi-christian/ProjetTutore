<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    */

    'paths' => [
        'api/*',
        'sanctum/csrf-cookie',
        'login',
        'logout',
    ],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'https://talla.cdwfs.net',
    ],

    // ✅ Autorise TOUS les sous-domaines ngrok
    'allowed_origins_patterns' => [
        '#^https://.*\.ngrok-free\.app$#',
        '#^https://.*\.ngrok\.io$#',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 86400,

    // ✅ Important si tu utilises cookies / sanctum
    'supports_credentials' => true,

];