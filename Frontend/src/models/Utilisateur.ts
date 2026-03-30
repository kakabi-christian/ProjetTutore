export interface UserRegistration {
  lastname: string;        // Nom 👤
  firstname: string;       // Prénom 👤
  email: string;           // Email 📧
  telephone: string;       // Téléphone (format international) 📱
  country: string;         // Pays 🌍
  password: string;        // Mot de passe 🔑
  password_confirmation: string; // Confirmation pour la validation Laravel ✅
}

/**
 * Interface pour l'utilisateur une fois connecté
 * (Reçu après le succès du Register ou Login)
 */
export interface User {
  user_id: number;
  lastname: string;
  firstname: string;
  email: string;
  type: 'user' | 'admin';
  telephone: string;
  country: string;
  isactive: boolean;
  isverified: boolean;
  lastlogin?: string;
  created_at?: string;
}
// models/User.ts