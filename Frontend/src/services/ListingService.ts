import type { Listing, ListingPaginationResponse } from "../models/Listing";
import api from "./api";

/**
 * Interface pour la réponse du taux de marché (Massive API via Backend)
 */
export interface MarketRateResponse {
  from: string;
  to: string;
  rate: number | null;
  timestamp: string;
}

/**
 * Interface pour les filtres de recherche d'annonces
 */
export interface ListingFilters {
  currency_from?: string;
  currency_to?: string;
  sort_by?: 'user_rate' | 'amount_available' | 'created_at';
  sort_order?: 'asc' | 'desc';
}

const ListingService = {
  /**
   * 📈 Récupère le taux de change officiel en direct
   */
  async getLiveMarketRate(from: string, to: string): Promise<number | null> {
    try {
      const response = await api.get<MarketRateResponse>('/market-rate', {
        params: { 
          from: from.toUpperCase(), 
          to: to.toUpperCase() 
        }
      });
      return response.data.rate;
    } catch (error) {
      console.error("Erreur lors de la récupération du taux officiel:", error);
      return null; 
    }
  },

  /**
   * 📜 Récupère la liste des annonces actives (Pagination + Filtres)
   * Utilisé pour le flux public du marché ExchaPay.
   */
  async getAllListings(
    page: number = 1,
    filters: ListingFilters = {}
  ): Promise<ListingPaginationResponse> {
    const response = await api.get<ListingPaginationResponse>('/listings', {
      params: {
        page,
        ...filters
      }
    });
    return response.data;
  },

  /**
   * 👤 Récupère les annonces de l'utilisateur connecté (Mes Publications)
   * Correspond à la route GET api/my-listings
   */
  async getUserListings(page: number = 1): Promise<ListingPaginationResponse> {
    try {
      const response = await api.get<ListingPaginationResponse>('/my-listings', {
        params: { page }
      });
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération de vos annonces:", error);
      throw error;
    }
  },

  /**
   * 🔍 Récupère les détails complets d'une annonce spécifique
   */
  async getListingById(id: number | string): Promise<Listing> {
    const response = await api.get<Listing>(`/listings/${id}`);
    return response.data;
  },

  /**
   * 🆕 Publie une nouvelle offre de change
   */
  async createListing(data: Partial<Listing>): Promise<{ message: string; listing: Listing }> {
    const response = await api.post('/listings', data);
    return response.data;
  },

  /**
   * 📝 Met à jour une annonce existante
   */
  async updateListing(id: number | string, data: Partial<Listing>): Promise<{ message: string; listing: Listing }> {
    const response = await api.put(`/listings/${id}`, data);
    return response.data;
  },

  /**
   * 🗑️ Supprime une annonce
   */
  async deleteListing(id: number | string): Promise<{ message: string }> {
    const response = await api.delete(`/listings/${id}`);
    return response.data;
  },

  /**
   * ⭐ Récupère les avis sur une annonce spécifique
   */
  async getListingReviews(listingId: number | string) {
    const response = await api.get(`/listings/${listingId}/reviews`);
    return response.data;
  }
};

export default ListingService;