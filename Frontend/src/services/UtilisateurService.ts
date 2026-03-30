// services/UtilisateurService.ts
import api from "./api";
import type { User } from "../models/Utilisateur";

/**
 * Interfaces pour les payloads de mise à jour
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

const UtilisateurService = {
  
  /**
   * 👤 RÉCUPÉRER LE PROFIL (ME)
   * Récupère les infos de l'utilisateur connecté depuis le serveur
   */
  async getProfile(): Promise<User> {
    try {
      const response = await api.get<{status: string, user: User}>('/me');
      // On met à jour le localStorage pour être sûr d'avoir les infos fraîches
      localStorage.setItem('user_data', JSON.stringify(response.data.user));
      return response.data.user;
    } catch (error) {
      console.error("Erreur récupération profil:", error);
      throw error;
    }
  },

  /**
   * 📝 METTRE À JOUR LE PROFIL
   * Met à jour les infos de base de l'utilisateur
   */
  async updateProfile(data: UpdateProfilePayload): Promise<User> {
    try {
      const response = await api.put<{status: string, message: string, user: User}>('/profile/update', data);
      // Très important pour ExchaPay : mettre à jour les données locales après modification
      localStorage.setItem('user_data', JSON.stringify(response.data.user));
      return response.data.user;
    } catch (error) {
      console.error("Erreur mise à jour profil:", error);
      throw error;
    }
  },

  /**
   * 🔑 CHANGER LE MOT DE PASSE
   * Envoie l'ancien et le nouveau mot de passe pour modification
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
   * 🛡️ ADMIN : LISTE DES UTILISATEURS
   * Récupère la liste simplifiée (Type 'user') pour les notifications
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