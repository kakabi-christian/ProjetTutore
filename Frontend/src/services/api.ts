import axios from 'axios';

/**
 * 💡 Note : En production, VITE_API_BASE_URL doit être "https://talla.cdwfs.net"
 * sans le slash final. On utilise une valeur par défaut vide pour éviter les erreurs.
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const api = axios.create({
  // On s'assure que l'URL est bien construite
  baseURL: `${API_BASE_URL}/api`,
  
  // 🛡️ CRUCIAL : Permet d'envoyer et recevoir les cookies de session (Sanctum)
  // Sans ça, le navigateur bloque la connexion même si le mot de passe est bon.
  withCredentials: true, 
  
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// 🛡️ Intercepteur de requête : ajoute le token avant l'envoi
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;