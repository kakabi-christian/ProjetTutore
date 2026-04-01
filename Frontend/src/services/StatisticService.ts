import api from "./api";

/**
 * Interface pour les statistiques de l'utilisateur
 */
export interface UserStatistics {
    summary: {
        total_volume: number;
        transactions_count: number;
        average_rating: number;
        growth_percentage: number;
    };
    listings: {
        total: number;
        active: number;
    };
    chart_data: Array<{
        month: number;
        volume: number;
        count: number;
    }>;
    period: {
        from: string;
        to: string;
    };
}

/**
 * Interface pour les statistiques administratives
 */
export interface AdminStatistics {
    users: {
        total_users: number;
        verified_users: number;
        new_users_period: number;
    };
    transactions: {
        total: number;
        completed: number;
        volume: number;
        revenue: number;
        success_rate: number;
    };
    listings: {
        active_listings: number;
        total_listings_period: number;
    };
    chart_data: Array<{
        date: string;
        count: number;
        volume: number;
    }>;
}

const StatisticService = {
    /**
     * Récupère les statistiques personnelles de l'utilisateur connecté
     * @param startDate Optionnel (YYYY-MM-DD)
     * @param endDate Optionnel (YYYY-MM-DD)
     */
    getUserStats: async (startDate?: string, endDate?: string): Promise<UserStatistics> => {
        const response = await api.get("/my-statistics", {
            params: { start_date: startDate, end_date: endDate }
        });
        return response.data.data;
    },

    /**
     * Récupère les statistiques globales (Réservé aux admins)
     * @param startDate Optionnel (YYYY-MM-DD)
     * @param endDate Optionnel (YYYY-MM-DD)
     */
    getAdminStats: async (startDate?: string, endDate?: string): Promise<AdminStatistics> => {
        const response = await api.get("/admin/statistics", {
            params: { start_date: startDate, end_date: endDate }
        });
        return response.data.data;
    }
};

export default StatisticService;