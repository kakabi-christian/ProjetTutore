import api from './api';
import type { User, UserRegistration } from '../models/User';
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
  login: async (credentials: Pick<UserRegistration, 'email' | 'password'>): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/login', credentials);
    
    // Si on reçoit un token, on le stocke pour l'intercepteur 💾
    if (response.data.access_token) {
      localStorage.setItem('auth_token', response.data.access_token);
    }
    
    return response.data;
  },

  /**
   * 3. Déconnexion (Logout) 🚪
   * Utilise le token via l'intercepteur pour révoquer l'accès
   */
  logout: async () => {
    await api.post('/logout');
    localStorage.removeItem('auth_token');
  },

  /**
   * 4. Vérification OTP 🛡️
   */
  verifyOtp: async (email: string, otp: string) => {
    const response = await api.post('/verify-otp', { email, otp });
    return response.data;
  }
};