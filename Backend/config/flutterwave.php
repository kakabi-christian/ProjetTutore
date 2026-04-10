<?php

/*
|--------------------------------------------------------------------------
| Flutterwave Configuration
|--------------------------------------------------------------------------
|
| Ce fichier permet de centraliser les clés API de Flutterwave pour 
| l'application ExchaPay. Les valeurs sont récupérées depuis le fichier .env.
|
*/

return [

    /**
     * Clé Publique (Public Key)
     */
    'publicKey' => env('FLW_PUBLIC_KEY'),

    /**
     * Clé Secrète (Secret Key)
     */
    'secretKey' => env('FLW_SECRET_KEY'),

    /**
     * Clé de Chiffrement (Encryption Key)
     */
    'encryptionKey' => env('FLW_ENCRYPTION_KEY'),

    /**
     * URL de base de l'API Flutterwave
     * Par défaut, on pointe sur le Sandbox pour tes tests de développement.
     */
    'baseUrl' => env('FLW_BASE_URL', 'https://developersandbox-api.flutterwave.com'),

     /**
     * Secret hash pour valider les webhooks entrants.
     * Tu choisis cette valeur librement, puis tu la copies dans :
     * Dashboard Flutterwave → Settings → Webhooks → "Secret hash"
     *
     * Ref: https://developer.flutterwave.com/docs/integration-guides/webhooks#verifying-webhooks
     */
    'webhookHash' => env('FLW_WEBHOOK_HASH'),
];