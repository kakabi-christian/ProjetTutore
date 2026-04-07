// models/Feedback.ts
import type { User } from './Utilisateur'; // Assure-toi d'avoir ce modèle pour la relation

export interface Feedback {
    feedback_id?: number;   // Optionnel car généré par la DB
    user_id: number;
    comment: string;
    note: number;           // Entre 1 et 5
    created_at?: string;
    updated_at?: string;

    // Relation optionnelle si tu récupères l'utilisateur avec le feedback (Eager Loading)
    utilisateur?: Partial<User>; 
}

/**
 * Interface pour la requête d'envoi de feedback
 */
export interface FeedbackRequestData {
    user_id: number;
    comment: string;
    note: number;
}