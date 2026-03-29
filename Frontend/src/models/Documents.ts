// models/Documents.ts
// models/Document.ts

/**
 * Interface représentant le type de document (CNI, Passeport, etc.)
 * Récupéré depuis la table 'type_documents'
 */
export interface TypeDocument {
    type_document_id: number;
    name: string;
    description?: string;
    created_at?: string;
    updated_at?: string;
}

/**
 * Interface représentant un document uploadé par l'utilisateur
 * Lié à un dossier KYC
 */
export interface Document {
    document_id: number;
    kyc_id: number;
    type_document_id: number;
    country_of_issue: string;
    file_url: string; // L'URL relative stockée en base de données
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    
    // Relation chargée via Eloquent (facultatif selon l'appel API)
    type_document?: TypeDocument;
    
    created_at: string;
    updated_at: string;
}

/**
 * Interface pour la structure de données lors de l'envoi au backend
 * Utilisé dans le FormData de soumission KYC
 */
export interface DocumentUpload {
    file: File;
    type_document_id: number;
}