<?php

namespace App\Swagger;

use OpenApi\Annotations as OA;

/**
 * @OA\Info(
 *      version="1.0.0",
 *      title="API Suivie Academique",
 *      description="Documentation API de suivi académique",
 *      @OA\Contact(
 *          email="ton.email@example.com"
 *      )
 * )
 *
 * @OA\Server(
 *      url=L5_SWAGGER_CONST_HOST,
 *      description="API Server"
 * )
 */
class Swagger
{
    // Classe vide, sert juste pour les annotations
}