import api from "./api";
import type { User } from "../models/Utilisateur";

/**
 * Interfaces pour les payloads
 * On utilise 'export type' ou 'export interface' 
 * pour faciliter les imports type-only
 */
export interface UpdateProfilePayload {
  lastname: string;
  firstname: string;
  telephone: string;
  country: string;
  email: string;
}

export interface UpdatePasswordPayload {
  old_password: string;
  new_password: string;
  new_password_confirmation: string;
}

export interface CreateCollaboratorPayload {
  lastname: string;
  firstname: string;
  email: string;
  telephone: string;
  country: string;
  role_id: number;
}

// Payload pour la modification (inclut le statut actif/inactif)
export interface UpdateCollaboratorPayload extends CreateCollaboratorPayload {
  isactive: boolean;
}

/**
 * Interface pour la réponse paginée de Laravel
 */
export interface PaginatedAdmins {
  data: User[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

const UtilisateurService = {
  
  /**
   * 👤 RÉCUPÉRER LE PROFIL (ME)
   */
  async getProfile(): Promise<User> {
    try {
      const response = await api.get<{status: string, user: User}>('/me');
      localStorage.setItem('user_data', JSON.stringify(response.data.user));
      return response.data.user;
    } catch (error) {
      console.error("Erreur récupération profil:", error);
      throw error;
    }
  },

  /**
   * 📝 METTRE À JOUR LE PROFIL
   */
  async updateProfile(data: UpdateProfilePayload): Promise<User> {
    try {
      const response = await api.put<{status: string, message: string, user: User}>('/profile/update', data);
      localStorage.setItem('user_data', JSON.stringify(response.data.user));
      return response.data.user;
    } catch (error) {
      console.error("Erreur mise à jour profil:", error);
      throw error;
    }
  },

  /**
   * 🔑 CHANGER LE MOT DE PASSE
   */
  async updatePassword(data: UpdatePasswordPayload): Promise<{message: string}> {
    try {
      const response = await api.post<{status: string, message: string}>('/profile/password', data);
      return response.data;
    } catch (error) {
      console.error("Erreur changement mot de passe:", error);
      throw error;
    }
  },

  /**
   * 🛡️ ADMIN : CRÉER UN COLLABORATEUR (ADMIN)
   */
  async adminCreateCollaborator(data: CreateCollaboratorPayload): Promise<{status: string, message: string, user: User}> {
    try {
      const response = await api.post<{status: string, message: string, user: User}>('/admin/collaborators', data);
      return response.data;
    } catch (error) {
      console.error("Erreur création collaborateur:", error);
      throw error;
    }
  },

  /**
   * 🛡️ ADMIN : MODIFIER UN COLLABORATEUR
   */
  async adminUpdateCollaborator(id: number, data: UpdateCollaboratorPayload): Promise<{status: string, message: string, user: User}> {
    try {
      const response = await api.put<{status: string, message: string, user: User}>(`/admin/collaborators/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Erreur modification collaborateur:", error);
      throw error;
    }
  },

  /**
   * 🛡️ ADMIN : SUPPRIMER UN COLLABORATEUR
   */
  async adminDeleteCollaborator(id: number): Promise<{status: string, message: string}> {
    try {
      const response = await api.delete<{status: string, message: string}>(`/admin/collaborators/${id}`);
      return response.data;
    } catch (error) {
      console.error("Erreur suppression collaborateur:", error);
      throw error;
    }
  },

  /**
   * 🛡️ ADMIN : LISTE DES ADMINISTRATEURS (PAGINÉE)
   */
  async adminGetAdminsList(page: number = 1, perPage: number = 10): Promise<PaginatedAdmins> {
    try {
      // On s'assure que le typage de la réponse correspond à l'interface PaginatedAdmins
      const response = await api.get<PaginatedAdmins>(`/admin/collaborators`, {
        params: { page, per_page: perPage }
      });
      return response.data;
    } catch (error) {
      console.error("Erreur récupération liste admins:", error);
      throw error;
    }
  },

  /**
   * 🛡️ ADMIN : LISTE DES UTILISATEURS (TYPE 'USER')
   */
  async adminGetUsersList(): Promise<User[]> {
    try {
      const response = await api.get<User[]>('/admin/users-list');
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération des utilisateurs:", error);
      throw error;
    }
  },
};

export default UtilisateurService;