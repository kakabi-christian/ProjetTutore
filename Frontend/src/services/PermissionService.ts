import api from "./api";
import type { PermissionPaginationResponse, AssignPermissionPayload } from "../models/Permission";

class PermissionService {
  /**
   * Récupère la liste paginée des permissions pour l'affichage (Admin)
   * @param page Le numéro de la page à récupérer
   * @param perPage Nombre d'éléments par page
   */
  async getAllPermissions(page: number = 1, perPage: number = 10): Promise<PermissionPaginationResponse> {
    const response = await api.get<PermissionPaginationResponse>(
      `/admin/permissions?page=${page}&per_page=${perPage}`
    );
    return response.data;
  }

  /**
   * Assigne une liste de permissions à un rôle spécifique
   * Action déclenchée après avoir cliqué sur l'icône "clé"
   * @param payload Objet contenant le role_id et le tableau d'identifiants de permissions
   */
  async assignPermissions(payload: AssignPermissionPayload): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/admin/roles/assign-permissions', payload);
    return response.data;
  }

  /**
   * Optionnel : Récupère les permissions déjà assignées à un rôle spécifique
   * Utile pour pré-cocher les cases dans ta modale
   * @param roleId L'ID du rôle concerné
   */
  async getPermissionsByRole(roleId: number): Promise<{ success: boolean; data: any[] }> {
    const response = await api.get(`/admin/roles/${roleId}/permissions`);
    return response.data;
  }
}

export default new PermissionService();