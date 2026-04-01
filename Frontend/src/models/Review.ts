// models/Review.ts
import type { User } from './Utilisateur';
import type { Listing } from './Listing';

/**
 * Interface représentant un avis laissé sur une annonce ExchaPay
 */
export interface Review {
    review_id: number;
    reviewer_id: number;
    listing_id: number;
    
    // Note (généralement de 1 à 5)
    rating: number;
    
    // Commentaire textuel de l'utilisateur
    comment: string | null;
    
    // Timestamps
    created_at: string;
    updated_at: string;

    // Relations (accessibles si chargées avec .with() au backend)
    reviewer?: User;
    listing?: Listing;
}