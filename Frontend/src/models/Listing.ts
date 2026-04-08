import type { ListingHistory } from './ListingHistory';
import type { Review } from './Review';
import type { User } from './Utilisateur';
import type { MethodPayment } from './MehodPayment'; // ✅ À importer

/**
 * Interface représentant une annonce d'échange sur ExchaPay
 */
export interface Listing {
    listing_id: number;
    user_id: number;
    
    // ✅ ID du compte de réception choisi par le vendeur
    method_payment_id: number; 

    // Devises (ISO 3 caractères : XAF, EUR, USD...)
    currency_from: string;
    currency_to: string;
    
    // Montants (Laravel renvoie souvent les decimal en string pour la précision)
    amount_available: string | number;
    min_amount: string | number | null;
    
    // Gestion des taux
    official_rate: string | number; 
    user_rate: string | number;
    
    // Design & Social
    visual_theme: string;
    description: string | null;
    
    // Attributs calculés (Accessors Laravel via $appends)
    discount_percentage?: number; 
    
    // Timestamps
    created_at: string;
    updated_at: string;

    // Relations (Chargées via Eloquent 'with')
    utilisateur?: User;
    payment_method?: MethodPayment; // ✅ Relation pour afficher le logo/nom du compte
    histories?: ListingHistory[];
    reviews?: Review[];
}

/**
 * Type pour la réponse paginée de l'API Laravel
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