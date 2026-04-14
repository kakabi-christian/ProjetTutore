import api from "./api";

export interface InitiateTransactionPayload {
    listing_id:     number;
    amount_from:    number;
    payment_method: 'MOBILE_MONEY' | 'CARD';
}

export interface TransactionSummary {
    you_receive:   number;
    currency_from: string;
    you_pay:       number;
    platform_fee:  number;
    total_charged: number;
    currency_to:   string;
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
    transaction_id:       number;
    buyer_id:             number;
    seller_id:            number;
    listing_id:           number;
    amount_from:          string | number;
    amount_to:            string | number;
    exchange_rate:        string | number;
    buyer_fee:            string | number;
    seller_fee:           string | number;
    status:               'PENDING' | 'AWAITING_SELLER' | 'AWAITING_SELLER_PAYMENT' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
    flw_tx_ref:           string | null;
    flw_tx_id:            string | null;
    buyer_payment_method: 'MOBILE_MONEY' | 'CARD';
    created_at:           string;
    updated_at:           string;
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
     * Initie un échange → retourne le payment_link Flutterwave.
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
     * Vendeur accepte la transaction.
     * POST /api/transactions/{id}/accept
     */
     accept: async (id: number) => {
        const response = await api.post(`/transactions/${id}/accept`);
        return response.data as {
            message: string;
            payment_link: string;   
            summary: {
            amount_to_send: number;
            seller_fee: number;
            total_charged: number;
            currency: string;
            }
        };
    },

    /**
     * Vendeur annule la transaction → remboursement Flutterwave.
     * POST /api/transactions/{id}/cancel
     */
    cancel: async (transactionId: number): Promise<{ message: string; status: string }> => {
        const response = await api.post(`/transactions/${transactionId}/cancel`);
        return response.data;
    },
};