import type { Document } from './Documents';
import type { User } from './User';

/**
 * Interface représentant le dossier KYC (Know Your Customer)
 */
export interface Kyc {
    kyc_id: number;
    user_id: number;
    current_level: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    rejection_reason: string | null;
    completed_at: string | null;
    
    // Relations chargées via Eloquent
    utilisateur?: User; // Utilisation de l'interface User définie plus bas
    documents?: Document[];
    
    created_at: string;
    updated_at: string;
}

/**
 * Interface pour la réponse paginée du Backend
 */
export interface KycPaginationResponse {
    message: string;
    data: Kyc[];
    pagination: {
        total: number;
        current_page: number;
        last_page: number;
        per_page?: number;
    };
}

/**
 * Structure pour l'envoi du formulaire (FormData)
 */
export interface KycSubmitPayload {
    country_of_issue: string;
    documents: {
        file: File;
        type_document_id: number;
    }[];
}