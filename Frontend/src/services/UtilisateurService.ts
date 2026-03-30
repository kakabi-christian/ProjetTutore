// services/UtilisateurService.ts
import api from "./api";
import type { User } from "../models/Utilisateur";
const UtilisateurService = {
  /**
   * Récupère la liste simplifiée des utilisateurs (Type 'user')
   * Utilisé par l'admin pour le ciblage des notifications.
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

  /**
   * (Optionnel) Récupère les détails d'un utilisateur spécifique
   */
  async getUserById(id: number): Promise<User> {
    const response = await api.get<User>(`/admin/users/${id}`);
    return response.data;
  }
};

export default UtilisateurService;