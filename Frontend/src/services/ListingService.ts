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
   * Utilisé dans le formulaire de création pour aider l'utilisateur à fixer son prix.
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
      // On retourne null pour que le composant React affiche "Taux indisponible"
      return null; 
    }
  },

  /**
   * 📜 Récupère la liste des annonces actives (Pagination + Filtres)
   * Parfait pour l'Infinite Scroll de ton application ExchaPay.
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
   * 🔍 Récupère les détails complets d'une annonce spécifique
   */
  async getListingById(id: number | string): Promise<Listing> {
    const response = await api.get<Listing>(`/listings/${id}`);
    return response.data;
  },

  /**
   * 🆕 Publie une nouvelle offre de change
   * @requires Auth (Sanctum Token)
   * @requires KYC_APPROVED (Géré par ton middleware backend)
   */
  async createListing(data: Partial<Listing>): Promise<{ message: string; listing: Listing }> {
    // Note : discount_percentage sera calculé automatiquement par le backend
    const response = await api.post('/listings', data);
    return response.data;
  },

  /**
   * 📝 Met à jour une annonce existante (ex: changer le montant disponible)
   */
  async updateListing(id: number | string, data: Partial<Listing>): Promise<{ message: string; listing: Listing }> {
    const response = await api.put(`/listings/${id}`, data);
    return response.data;
  },

  /**
   * 🗑️ Supprime une annonce
   * @throws 422 si une transaction Escrow est déjà liée (sécurité antifraude)
   */
  async deleteListing(id: number | string): Promise<{ message: string }> {
    const response = await api.delete(`/listings/${id}`);
    return response.data;
  },

  /**
   * ⭐ Récupère les avis (reviews) laissés sur une annonce spécifique
   */
  async getListingReviews(listingId: number | string) {
    const response = await api.get(`/listings/${listingId}/reviews`);
    return response.data;
  }
};

export default ListingService;