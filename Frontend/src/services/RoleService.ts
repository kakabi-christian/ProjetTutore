// services/RoleService.ts
import api from "./api";
import type { Role, RoleResponse, RolePayload } from "../models/Role";

const RoleService = {
  /**
   * Récupère la liste des rôles avec pagination.
   * @param page Le numéro de la page à récupérer
   * @param perPage Le nombre d'éléments par page
   */
  getRoles: async (page: number = 1, perPage: number = 10): Promise<RoleResponse> => {
    const response = await api.get<RoleResponse>(`/admin/roles?page=${page}&per_page=${perPage}`);
    return response.data;
  },

  /**
   * Récupère un rôle spécifique par son ID.
   */
  getRoleById: async (id: number): Promise<{ status: string; data: Role }> => {
    const response = await api.get<{ status: string; data: Role }>(`/admin/roles/${id}`);
    return response.data;
  },

  /**
   * Crée un nouveau rôle.
   */
  createRole: async (payload: RolePayload): Promise<{ status: string; message: string; data: Role }> => {
    const response = await api.post<{ status: string; message: string; data: Role }>(
      "/admin/roles", 
      payload
    );
    return response.data;
  },

  /**
   * Met à jour un rôle existant.
   */
  updateRole: async (id: number, payload: RolePayload): Promise<{ status: string; message: string; data: Role }> => {
    const response = await api.put<{ status: string; message: string; data: Role }>(
      `/admin/roles/${id}`, 
      payload
    );
    return response.data;
  },

  /**
   * Supprime un rôle.
   */
  deleteRole: async (id: number): Promise<{ status: string; message: string }> => {
    const response = await api.delete<{ status: string; message: string }>(`/admin/roles/${id}`);
    return response.data;
  }
};

export default RoleService;