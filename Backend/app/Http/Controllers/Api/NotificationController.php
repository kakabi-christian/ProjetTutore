<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\NotificationRequest;
use App\Models\Notification;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    /**
     * Récupérer les notifications (Personnelles + Broadcast).
     * GET /api/notifications
     */
    public function index()
    {
        // Utilisation du scope pour inclure les messages globaux
        $notifications = Notification::forUser(Auth::id())
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $notifications,
        ]);
    }

    /**
     * Récupérer uniquement le nombre de notifications NON LUES.
     * GET /api/notifications/unread-count
     */
    public function unreadCount()
    {
        $count = Notification::forUser(Auth::id())
            ->where('is_read', false)
            ->count();

        return response()->json([
            'success' => true,
            'unread_count' => $count,
        ]);
    }

    /**
     * Marquer une notification spécifique comme lue.
     * PATCH /api/notifications/{id}/mark-as-read
     */
    public function markAsRead($id)
    {
        // On vérifie que la notification appartient bien à l'user OU est un broadcast
        $notification = Notification::forUser(Auth::id())
            ->where('notification_id', $id)
            ->firstOrFail();

        $notification->update(['is_read' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Notification marquée comme lue.',
        ]);
    }

    /**
     * Marquer TOUTES les notifications comme lues.
     * POST /api/notifications/mark-all-as-read
     */
    public function markAllAsRead()
    {
        Notification::forUser(Auth::id())
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Toutes les notifications ont été marquées comme lues.',
        ]);
    }

    /**
     * Créer une notification (Admin).
     * POST /api/admin/notifications
     */
    public function store(NotificationRequest $request)
    {
        // On récupère les données validées
        $data = $request->validated();

        // Logique de sécurité : si c'est un broadcast, user_id peut être null
        if (! empty($data['is_broadcast']) && $data['is_broadcast'] == true) {
            $data['user_id'] = null;
        }

        $notification = Notification::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Notification envoyée avec succès',
            'data' => $notification,
        ], 201);
    }

    /**
     * Supprimer une notification spécifique (Admin).
     * DELETE /api/admin/notifications/{id}
     */
    public function destroy($id)
    {
        // Seul l'admin supprime généralement, ou l'utilisateur ses propres notifs
        $notification = Notification::where('notification_id', $id)->firstOrFail();

        $notification->delete();

        return response()->json([
            'success' => true,
            'message' => 'Notification supprimée définitivement.',
        ]);
    }
}
