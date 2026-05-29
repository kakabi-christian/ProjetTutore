// src/services/TypeDocumentService.ts
import api from "./api";
// Utilisation de "import type" pour satisfaire 'verbatimModuleSyntax'
import type { 
    TypeDocument, 
    CreateTypeDocument, 
} from "../models/TypeDocument";

/**
 * Métadonnées de pagination correspondant à la structure Laravel
 */
export interface PaginationMeta {
    total: number;
    current_page: number;
    per_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
}

/**
 * Interface pour la réponse paginée du contrôleur
 */
interface PaginatedResponse<T> {
    message: string;
    data: T[];
    pagination: PaginationMeta;
}

/**
 * Interface pour les réponses simples (show, store, update)
 */
interface TypeDocumentResponse<T> {
    message: string;
    data: T;
}

export const typeDocumentService = {
  
    /**
     * 1. Récupérer les types avec pagination (Route publique) 📄
     * GET /api/type-documents?page=1&per_page=10
     */
    getAll: async (page: number = 1, perPage: number = 10): Promise<PaginatedResponse<TypeDocument>> => {
        const response = await api.get<PaginatedResponse<TypeDocument>>(
            `/type-documents?page=${page}&per_page=${perPage}`
        );
        return response.data;
    },

    /**
     * 2. Récupérer un type spécifique (Route publique) 🔍
     */
    getById: async (id: number): Promise<TypeDocumentResponse<TypeDocument>> => {
        const response = await api.get<TypeDocumentResponse<TypeDocument>>(`/type-documents/${id}`);
        return response.data;
    },

    /**
     * 3. Créer un type (Route Admin) ➕
     * POST /api/admin/type-documents
     */
    create: async (data: CreateTypeDocument & { file?: File }): Promise<TypeDocumentResponse<TypeDocument>> => {
        const formData = new FormData();
        
        // Ajout du nom du document
        formData.append('name', data.name);
        
        // Ajout du fichier s'il est présent
        if (data.file) {
            formData.append('file', data.file);
        }

        const response = await api.post<TypeDocumentResponse<TypeDocument>>(
            '/admin/type-documents', 
            formData, 
            {
                headers: { 'Content-Type': 'multipart/form-data' }
            }
        );
        return response.data;
    },

    /**
     * 4. Mettre à jour (Route Admin) ✏️
     * POST /api/admin/type-documents/{id} (Émulé en PUT via _method pour préserver le fichier)
     */
    update: async (id: number, data: Partial<CreateTypeDocument> & { file?: File }): Promise<TypeDocumentResponse<TypeDocument>> => {
        const formData = new FormData();
        
        if (data.name) {
            formData.append('name', data.name);
        }
        if (data.file) {
            formData.append('file', data.file);
        }
        
        // Spoofing de méthode indispensable pour que Laravel lise les fichiers binaires en PUT
        formData.append('_method', 'PUT');

        const response = await api.post<TypeDocumentResponse<TypeDocument>>(
            `/admin/type-documents/${id}`, 
            formData, 
            {
                headers: { 'Content-Type': 'multipart/form-data' }
            }
        );
        return response.data;
    },

    /**
     * 5. Supprimer (Route Admin) 🗑️
     */
    delete: async (id: number): Promise<{ message: string }> => {
        const response = await api.delete<{ message: string }>(`/admin/type-documents/${id}`);
        return response.data;
    }
};