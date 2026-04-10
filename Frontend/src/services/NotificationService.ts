import api from "./api";
import type { NotificationResponse } from "../models/Notification";

export const notificationService = {
    
    // ==========================================
    // PARTIE UTILISATEUR (Dashboard)
    // ==========================================

    /**
     * Récupère les notifications de l'utilisateur connecté
     * GET api/notifications
     */
    async getUserNotifications(page: number = 1): Promise<NotificationResponse> {
        const response = await api.get<NotificationResponse>(`/notifications?page=${page}`);
        console.log(response.data)
        return response.data;
    },

    /**
     * Récupère le nombre de notifications non lues (Badge)
     * GET api/notifications/unread-count
     */
    async getUnreadCount(): Promise<number> {
        const response = await api.get<{ unread_count: number }>('/notifications/unread-count');
        return response.data.unread_count;
    },

    /**
     * Marque une notification spécifique comme lue
     * PATCH api/notifications/{id}/mark-as-read
     */
    async markAsRead(id: number): Promise<void> {
        await api.patch(`/notifications/${id}/mark-as-read`);
    },

    /**
     * Marque toutes les notifications de l'utilisateur comme lues
     * POST api/notifications/mark-all-as-read
     */
    async markAllAsRead(): Promise<void> {
        await api.post('/notifications/mark-all-as-read');
    },

    // ==========================================
    // PARTIE ADMINISTRATION (Back-office)
    // ==========================================

    /**
     * Envoie une nouvelle notification (Admin)
     * user_id est number si ciblé, ou null si is_broadcast est true
     */
    async adminSendNotification(data: { 
        user_id: number | null; 
        type: number; 
        title: string; 
        message: string;
        is_broadcast: boolean;
    }): Promise<any> {
        const response = await api.post('/admin/notifications', data);
        return response.data;
    },

    /**
     * Supprime une notification (Admin)
     * DELETE api/admin/notifications/{id}
     */
    async adminDeleteNotification(id: number): Promise<void> {
        await api.delete(`/admin/notifications/${id}`);
    },

    /**
     * Optionnel : Récupérer l'historique des notifications envoyées par l'admin
     * GET api/admin/notifications
     */
    async adminGetSentNotifications(page: number = 1): Promise<any> {
        const response = await api.get(`/admin/notifications?page=${page}`);
        return response.data;
    }
};

export default notificationService;