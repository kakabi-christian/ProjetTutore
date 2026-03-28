// src/models/TypeDocument.ts
// src/models/TypeDocument.ts

export interface TypeDocument {
    type_document_id: number;
    name: string;
    description: string;
    created_at?: string;
    updated_at?: string;
}

/**
 * Interface utilisée pour la création d'un nouveau type de document
 * (On exclut l'ID car il est généré par la base de données)
 */
export interface CreateTypeDocument {
    name: string;
    description: string;
}

/**
 * Interface pour la mise à jour (tous les champs sont optionnels sauf l'ID)
 */
export interface UpdateTypeDocument extends Partial<CreateTypeDocument> {
    type_document_id: number;
}