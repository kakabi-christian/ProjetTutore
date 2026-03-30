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
