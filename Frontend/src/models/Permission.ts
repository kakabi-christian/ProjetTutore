// models/Permission.ts
/**
 * Interface représentant une Permission dans le système ExchaPay
 */
export interface Permission {
  permission_id: number;
  name: string;
  description: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Structure de la réponse paginée renvoyée par le PermissionController
 */
export interface PermissionPaginationResponse {
  success: boolean;
  data: Permission[];
  pagination: {
    total: number;
    count: number;
    per_page: number;
    current_page: number;
    total_pages: number;
  };
}

/**
 * Payload pour l'assignation des permissions à un rôle
 * (Utilisé lors du clic sur la "clé" dans ton interface)
 */
export interface AssignPermissionPayload {
  role_id: number;
  permissions: number[]; // Tableau d'IDs de permissions
}