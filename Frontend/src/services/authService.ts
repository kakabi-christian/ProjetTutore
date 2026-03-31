import api from './api';
import type { User, UserRegistration } from '../models/Utilisateur';
// Interface pour la réponse typique du backend
interface AuthResponse {
  status: string;
  message: string;
  user: User;
  access_token?: string;
  token_type?: string;
}

export const authService = {
  
  /**
   * 1. Inscription (Register) 📝
   * Envoie les données vers POST /api/register
   */
  register: async (userData: UserRegistration): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/register', userData);
    return response.data;
  },

  /**
   * 2. Connexion (Login) 🔑
   * Envoie l'email et le password vers POST /api/login
   */
  /**
   * 2. Connexion (Login) 🔑
   */
  login: async (credentials: Pick<UserRegistration, 'email' | 'password'>): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/login', credentials);
    
    // 💾 Stockage du Token
    if (response.data.access_token) {
      localStorage.setItem('auth_token', response.data.access_token);
    }

    // 👤 NOUVEAU : Stockage des données utilisateur
    // On transforme l'objet user en chaîne JSON pour le localStorage
    if (response.data.user) {
      localStorage.setItem('user_data', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },

  /**
   * 3. Déconnexion (Logout) 🚪
   */
  logout: async () => {
    try {
      await api.post('/logout');
    } finally {
      // On nettoie TOUT, même si la requête API échoue
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data'); // On nettoie aussi le user_data
    }
  },

  /**
   * 4. Vérification OTP 🛡️
   */
  verifyOtp: async (email: string, otp: string) => {
    const response = await api.post('/verify-otp', { email, otp });
    return response.data;
  }
};