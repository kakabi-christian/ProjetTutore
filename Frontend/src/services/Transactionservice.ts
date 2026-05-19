import api from "./api";

export interface InitiateTransactionPayload {
    listing_id:               number;
    amount_from:              number;
    payment_method:           'MOBILE_MONEY' | 'CARD';
    buyer_method_payment_id:  number;   // ← Compte de réception acheteur (Phase 3)
}

export interface TransactionSummary {
    amount_from:   number;
    currency_from: string;
    amount_to:     number;
    currency_to:   string;
    buyer_fee:     number;
    total_to_pay:  number;
    exchange_rate: number;
}

export interface InitiateTransactionResponse {
    message:        string;
    payment_link:   string;
    transaction_id: number;
    flw_tx_ref:     string;
    summary:        TransactionSummary;
}

export interface Transaction {
    transaction_id:           number;
    buyer_id:                 number;
    seller_id:                number;
    listing_id:               number;
    amount_from:              string | number;
    amount_to:                string | number;
    exchange_rate:            string | number;
    buyer_fee:                string | number;
    seller_fee:               string | number;
    status:                   'PENDING' | 'AWAITING_SELLER' | 'AWAITING_SELLER_PAYMENT' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
    flw_tx_ref:               string | null;
    flw_tx_id:                string | null;
    buyer_payment_method:     'MOBILE_MONEY' | 'CARD';
    buyer_method_payment_id:  number | null;
    created_at:               string;
    updated_at:               string;
    listing?: {
        listing_id:    number;
        currency_from: string;
        currency_to:   string;
    };
    buyer?: {
        user_id:   number;
        firstname: string;
        lastname:  string;
    };
    seller?: {
        user_id:   number;
        firstname: string;
        lastname:  string;
    };
    buyer_method_payment?: {
        method_payment_id: number;
        type:              string;
        provider:          string;
        account_number:    string;
    };
}

export interface TransactionPaginationResponse {
    current_page: number;
    data:         Transaction[];
    last_page:    number;
    total:        number;
    per_page:     number;
}

export const transactionService = {

    /**
     * Phase 1 — Initie un échange.
     * POST /api/transactions/initiate
     */
    initiate: async (payload: InitiateTransactionPayload): Promise<InitiateTransactionResponse> => {
        const response = await api.post<InitiateTransactionResponse>('/transactions/initiate', payload);
        return response.data;
    },

    /**
     * Transactions de l'utilisateur (acheteur OU vendeur).
     * GET /api/transactions/my
     */
    getUserTransactions: async (page = 1): Promise<TransactionPaginationResponse> => {
        const response = await api.get<TransactionPaginationResponse>(`/transactions/my?page=${page}`);
        return response.data;
    },

    /**
     * Phase 2 — Vendeur accepte → retourne payment_link pour son paiement.
     * POST /api/transactions/{id}/accept
     */
    accept: async (id: number): Promise<{
        message:      string;
        payment_link: string;
        summary: {
            amount_to_send: number;
            seller_fee:     number;
            total_charged:  number;
            currency:       string;
        };
    }> => {
        const response = await api.post(`/transactions/${id}/accept`);
        return response.data;
    },

    /**
     * Vendeur annule → remboursement Flutterwave de l'acheteur.
     * POST /api/transactions/{id}/cancel
     */
    cancel: async (id: number): Promise<{ message: string; status: string }> => {
        const response = await api.post(`/transactions/${id}/cancel`);
        return response.data;
    },
};