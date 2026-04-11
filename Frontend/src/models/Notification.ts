/**
 * Remplacement de l'Enum par un objet constant (compatible erasableSyntaxOnly)
 */
export const NotificationType = {
    SUCCESS: 1,
    ERROR: 2,
    INFO: 3,
    WARNING: 4,
} as const;

// Ce type permet de s'assurer que 'type' ne peut être que 1, 2, 3 ou 4
export type NotificationType = typeof NotificationType[keyof typeof NotificationType];

export interface Notification {
    notification_id: number;
    // user_id est désormais nullable car un broadcast n'a pas d'utilisateur spécifique
    user_id: number | null; 
    type: NotificationType;
    title: string;
    message: string;
    is_read: boolean;
    // Nouveau champ pour savoir si c'est une annonce générale
    is_broadcast: boolean; 
    created_at: string;
    updated_at: string;
}

/**
 * Interface pour la réponse paginée de Laravel
 */
export interface NotificationResponse {
    success: boolean;
    data: {
        current_page: number;
        data: Notification[];
        last_page: number;
        total: number;
        per_page: number;
    };
}