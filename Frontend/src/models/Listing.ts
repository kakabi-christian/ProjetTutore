import type { ListingHistory } from './ListingHistory';
import type { Review } from './Review';
import type { User } from './Utilisateur';

/**
 * Interface représentant une annonce d'échange sur ExchaPay
 */
export interface Listing {
    listing_id: number;
    user_id: number;
    
    // Devises (ISO 3 caractères)
    currency_from: string;
    currency_to: string;
    
    // Montants (Transmis sous forme de string par Laravel decimal, à convertir en number si besoin)
    amount_available: string | number;
    min_amount: string | number | null;
    
    // Gestion des taux
    // official_rate correspond au taux du marché lors de la création
    official_rate: string | number; 
    user_rate: string | number;
    
    // Design & Social
    visual_theme: string;
    description: string | null;
    
    // Attributs calculés (Accessors Laravel)
    discount_percentage?: number;
    
    // Timestamps
    created_at: string;
    updated_at: string;

    // Relations (Chargées via Eloquent 'with')
    utilisateur?: User;
    histories?: ListingHistory[];
    reviews?: Review[];
}

/**
 * Type pour la réponse paginée de l'API
 */
export interface ListingPaginationResponse {
    current_page: number;
    data: Listing[];
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
}