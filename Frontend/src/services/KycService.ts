// services/KycService.ts
import type { Kyc, KycPaginationResponse, KycSubmitPayload } from "../models/Kyc";
import api from "./api";

const KycService = {
  /**
   * Soumettre un dossier KYC complet (User)
   * Utilise FormData pour gérer l'upload des fichiers
   */
  submitKyc: async (payload: KycSubmitPayload) => {
    const formData = new FormData();
    formData.append('country_of_issue', payload.country_of_issue);

    // On boucle sur les documents pour les ajouter au FormData
    // La structure 'documents[index][champ]' correspond à la validation Laravel
    payload.documents.forEach((doc, index) => {
      formData.append(`documents[${index}][file]`, doc.file);
      formData.append(`documents[${index}][type_document_id]`, doc.type_document_id.toString());
    });

    const response = await api.post('/kyc/submit', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Récupérer le statut du KYC de l'utilisateur connecté (User)
   */
  getMyKycStatus: async (): Promise<{ data: Kyc }> => {
    const response = await api.get('/my-kyc');
    return response.data;
  },

  /**
   * Liste paginée des dossiers KYC (Admin)
   */
  getAllKycs: async (page: number = 1, perPage: number = 10): Promise<KycPaginationResponse> => {
    const response = await api.get(`/admin/kycs?page=${page}&per_page=${perPage}`);
    return response.data;
  },

  /**
   * Voir les détails d'un dossier KYC spécifique (Admin)
   */
  getKycDetails: async (id: number): Promise<{ data: Kyc }> => {
    const response = await api.get(`/admin/kycs/${id}`);
    return response.data;
  },

  /**
   * Approuver un dossier KYC (Admin)
   */
  approveKyc: async (id: number) => {
    const response = await api.post(`/admin/kycs/${id}/approve`);
    return response.data;
  },

  /**
   * Rejeter un dossier KYC avec un motif (Admin)
   */
  rejectKyc: async (id: number, reason: string) => {
    const response = await api.post(`/admin/kycs/${id}/reject`, { reason });
    return response.data;
  }
};

export default KycService;