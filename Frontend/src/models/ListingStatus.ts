import type { Listing } from './Listing';

/**
 * On remplace l'enum par un objet constant (POJO)
 * Le suffixe "as const" est crucial ici pour que TS fige les valeurs.
 */
export const ListingStatusTitle = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    EXPIRED: 'expired',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
} as const;

/**
 * On crée un type basé sur les valeurs de l'objet ci-dessus.
 * Cela équivaut à : 'active' | 'inactive' | 'expired' | 'completed' | 'cancelled'
 */
export type ListingStatusTitleType = typeof ListingStatusTitle[keyof typeof ListingStatusTitle];

/**
 * Interface représentant le modèle de données du statut
 */
export interface ListingStatus {
    listing_status_id: number;
    
    // On utilise le type généré pour la validation
    title: ListingStatusTitleType;

    // Timestamps
    created_at: string;
    updated_at: string;

    // Relation inverse
    listings?: Listing[];
}