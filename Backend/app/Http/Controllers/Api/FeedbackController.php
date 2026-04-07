<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\FeedbackRequest;
use App\Models\Feedback;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class FeedbackController extends Controller
{
    /**
     * Affiche la liste des feedbacks (Admin).
     */

    /**
     * @OA\Post(
     *      path="/feedback",
     *      summary="Enregistre ou met à jour le feedback d'un utilisateur",
     *      tags={"Feedback"},
     *      security={{"bearerAuth":{}}},
     *      @OA\RequestBody(
     *          required=true,
     *          @OA\JsonContent(
     *              required={"user_id", "comment", "note"},
     *              @OA\Property(property="user_id", type="string", format="uuid", example="123e4567-e89b-12d3..."),
     *              @OA\Property(property="comment", type="string", example="Super application!"),
     *              @OA\Property(property="note", type="integer", example=5)
     *          )
     *      ),
     *      @OA\Response(response=200, description="Feedback mis à jour avec succès"),
     *      @OA\Response(response=201, description="Feedback enregistré"),
     *      @OA\Response(response=500, description="Erreur serveur")
     * )
     *
     * Enregistre ou met à jour le feedback d'un utilisateur.
     */
    public function store(FeedbackRequest $request): JsonResponse
    {
        try {
            // updateOrCreate cherche par 'user_id'
            // Si trouvé -> update le reste. Si pas trouvé -> create tout.
            $feedback = Feedback::updateOrCreate(
                ['user_id' => $request->user_id],
                [
                    'comment' => $request->comment,
                    'note' => $request->note,
                ]
            );

            $wasRecentlyCreated = $feedback->wasRecentlyCreated;

            return response()->json([
                'message' => $wasRecentlyCreated
                    ? 'Merci ! Votre feedback a été enregistré.'
                    : 'Votre feedback a été mis à jour avec succès.',
                'data' => $feedback,
            ], $wasRecentlyCreated ? 201 : 200);

        } catch (\Exception $e) {
            Log::error('Erreur Feedback : '.$e->getMessage());

            return response()->json([
                'message' => 'Une erreur est survenue lors de l\'enregistrement.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
