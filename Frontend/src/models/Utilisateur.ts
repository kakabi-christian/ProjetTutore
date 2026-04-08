import type { Role } from './Role';

/**
 * Interface pour l'inscription d'un utilisateur standard
 */
export interface UserRegistration {
  lastname: string;             // Nom 👤
  firstname: string;            // Prénom 👤
  email: string;                // Email 📧
  telephone: string;            // Téléphone (format international) 📱
  country: string;              // Nom complet du pays (ex: Cameroun) 🌍
  country_code: string;         // Code ISO 2 lettres (ex: CM) 🆔
  password: string;             // Mot de passe 🔑
  password_confirmation: string; // Confirmation pour la validation Laravel ✅
}

/**
 * Interface principale de l'utilisateur
 */
export interface User {
  user_id: number;
  lastname: string;
  firstname: string;
  email: string;
  type: 'user' | 'admin';
  telephone: string;
  country: string;
  country_code: string;         // Ajouté pour la cohérence globale
  isactive: boolean;
  isverified: boolean;
  lastlogin?: string;
  created_at?: string;
  roles?: Role[];
}

/**
 * Payloads pour les actions administratives (Collaborateurs)
 */
export interface CreateCollaboratorPayload {
  lastname: string;
  firstname: string;
  email: string;
  telephone: string;
  country: string;
  country_code: string;         // Obligatoire pour la création
  role_id: number;
  isactive: boolean;
}

export interface UpdateCollaboratorPayload extends Partial<CreateCollaboratorPayload> {
  // Les champs deviennent optionnels pour les mises à jour (PATCH)
}

/**
 * Interface de pagination standard (Laravel Resource Collection)
 */
export interface PaginatedAdmins {
  data: User[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}