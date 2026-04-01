// models/ListingHistory.ts
import type { Listing } from './Listing';
import type { ListingStatus } from './ListingStatus';

/**
 * Interface représentant l'historique des changements de statut d'une annonce
 */
export interface ListingHistory {
    listing_history_id: number;
    listing_id: number;
    listing_status_id: number;
    
    // La date du changement de statut (Castée en datetime par Laravel)
    date: string; 

    // Timestamps standards
    created_at: string;
    updated_at: string;

    // Relations (disponibles si chargées via eager loading)
    listing?: Listing;
    listing_status?: ListingStatus;
}