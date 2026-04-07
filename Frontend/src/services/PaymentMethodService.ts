import api from "./api";
import type { 
    MethodPayment, 
    MethodPaymentResponse, 
    AvailableProvider 
} from "../models/MehodPayment";

/**
 * Interface pour la création (Payload envoyé au Backend)
 */
export interface CreatePaymentMethodPayload {
    type: 'MOBILE_MONEY' | 'BANK' | 'CARD';
    provider: string;
    currency: string;
    account_number: string;
    account_name: string;
    bank_code?: string;
}

/**
 * Interface pour la réponse de Flutterwave (disponibilité)
 */
interface AvailableMethodsResponse {
    status: string;
    mobile_networks: AvailableProvider[];
    banks: AvailableProvider[];
}

export const paymentMethodService = {
    
    /**
     * 1. Récupérer les méthodes de l'utilisateur (PAGINÉ) 💳
     * GET /api/payment-methods?page=1&per_page=10
     */
    getUserMethods: async (page: number = 1, perPage: number = 10): Promise<MethodPaymentResponse> => {
        const response = await api.get<MethodPaymentResponse>('/payment-methods', {
            params: { page, per_page: perPage }
        });
        return response.data;
    },

    /**
     * 2. Récupérer les réseaux/banques disponibles par pays 🌍
     * Appelé quand l'utilisateur veut ajouter une nouvelle méthode.
     * GET /api/payment-methods/available?country_code=CM
     */
    getAvailableProviders: async (countryCode: string): Promise<AvailableMethodsResponse> => {
        const response = await api.get<AvailableMethodsResponse>('/payment-methods/available', {
            params: { country_code: countryCode }
        });
        return response.data;
    },

    /**
     * 3. Enregistrer un nouveau mode de paiement 💾
     * POST /api/payment-methods
     */
    storeMethod: async (payload: CreatePaymentMethodPayload): Promise<{ 
        status: string; 
        message: string; 
        data: MethodPayment; 
    }> => {
        const response = await api.post('/payment-methods', payload);
        return response.data;
    },

    /**
     * 4. Supprimer un mode de paiement 🗑️
     * DELETE /api/payment-methods/{id}
     */
    deleteMethod: async (id: number): Promise<{ status: string; message: string }> => {
        const response = await api.delete(`/payment-methods/${id}`);
        return response.data;
    }
};