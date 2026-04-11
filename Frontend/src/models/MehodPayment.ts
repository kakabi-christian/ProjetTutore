// models/MethodPayment.ts
/**
 * Représente un mode de paiement enregistré par l'utilisateur
 */
export interface MethodPayment {
    method_payment_id: number;
    user_id: number;
    
    // Types supportés par le Backend & Flutterwave
    type: 'MOBILE_MONEY' | 'BANK' | 'CARD';
    
    // Nom de l'opérateur ou de la banque (ex: MTN, Orange, UBA)
    provider: string;
    
    // Devise (ex: XAF, NGN, GHS)
    currency: string;
    
    // Numéro (chiffré côté serveur, mais lu en clair via l'API)
    account_number: string;
    
    // Nom du titulaire du compte
    account_name: string;
    
    // Code banque Flutterwave (optionnel pour MoMo, requis pour BANK)
    bank_code?: string;
    
    // États du compte
    is_default: boolean;
    is_verified: boolean;
    
    created_at?: string;
    updated_at?: string;
}

/**
 * Structure de la réponse paginée du Backend (index)
 */
export interface MethodPaymentResponse {
    status: string;
    data: MethodPayment[]; // Les items réels
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    links: {
        next: string | null;
        prev: string | null;
    };
}

/**
 * Interface pour les méthodes disponibles (via FlutterwaveService)
 * Utilisé pour remplir les Select (choix de l'opérateur ou de la banque)
 */
export interface AvailableProvider {
    id: number | string;
    name: string;      // ex: "MTN Mobile Money" ou "Access Bank"
    network?: string;  // Utilisé pour Mobile Money (ex: "MTN")
    code?: string;     // Utilisé pour les Banques (ex: "058")
}

/**
 * Interface pour la création d'une nouvelle méthode (Payload)
 */
export interface CreatePaymentMethodPayload {
    type: 'MOBILE_MONEY' | 'BANK' | 'CARD';
    provider: string;
    currency: string;
    account_number: string;
    account_name: string;
    bank_code?: string;
}