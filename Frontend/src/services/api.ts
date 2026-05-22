import axios, { type InternalAxiosRequestConfig } from 'axios';
/**
 * 💡 Note : En production, VITE_API_BASE_URL doit être "https://talla.cdwfs.net"
 * sans le slash final.
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const api = axios.create({
  // 🔄 En développement, on laisse Vite gérer le proxy via '/api'
  // En production, on utilise l'URL absolue du .env
  baseURL: import.meta.env.DEV ? '/api' : `${API_BASE_URL}/api`,
  
  // 🛡️ CRUCIAL : Permet d'envoyer et recevoir les cookies de session (Sanctum)
  withCredentials: true, 
  
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// 🛡️ Intercepteur de requête : ajoute le token et les headers requis pour ngrok
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('auth_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 💡 AJOUT : Force ngrok à contourner l'écran d'avertissement pour toutes les requêtes du dashboard
    config.headers['ngrok-skip-browser-warning'] = 'true';
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;