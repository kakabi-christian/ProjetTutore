import api from "./api";

export interface InitiateTransactionPayload {
    listing_id: number;
    amount_from: number;       // = listing.amount_available
    payment_method: 'MOBILE_MONEY' | 'CARD';
}

export interface TransactionSummary {
    you_receive:    number;
    currency_from:  string;
    you_pay:        number;
    platform_fee:   number;
    total_charged:  number;
    currency_to:    string;
    exchange_rate:  number;
}

export interface InitiateTransactionResponse {
    message:        string;
    payment_link:   string;
    transaction_id: number;
    flw_tx_ref:     string;
    summary:        TransactionSummary;
}

export const transactionService = {

    /**
     * Initie un échange et retourne le lien de paiement Flutterwave.
     * POST /api/transactions/initiate
     * 
     * Après réception du payment_link, le frontend redirige l'user :
     *   window.location.href = response.payment_link
     */
    initiate: async (payload: InitiateTransactionPayload): Promise<InitiateTransactionResponse> => {
        const response = await api.post<InitiateTransactionResponse>('/transactions/initiate', payload);
        return response.data;
    },
};