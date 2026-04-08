<?php

namespace App\Http\Controllers;

/**
 * @OA\Info(
 *    title="ProjetTutore API",
 *    version="1.0.0",
 * )
 *
 * @OA\Server(
 *    url=L5_SWAGGER_CONST_HOST,
 *    description="Primary API Server"
 * )
 *
 * @OA\SecurityScheme(
 *      securityScheme="bearerAuth",
 *      type="http",
 *      scheme="bearer"
 * )
 */
abstract class Controller
{
    //
}
