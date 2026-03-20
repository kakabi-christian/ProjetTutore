<?php

return [
    'paths' => ['api/*','filiere', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => ['*'], // tu peux remplacer par http://localhost:4200
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];

//ISO9126 : Norme de definition d'un logiciel 