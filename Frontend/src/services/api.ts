import axios from 'axios';

// Ici, API_BASE_URL récupère "http://localhost:8000" depuis ton .env
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  // On concatène manuellement '/api' pour que toutes les requêtes 
  // vers Laravel utilisent le bon préfixe de route.
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// 🛡️ Intercepteur de requête : ajoute le token avant l'envoi
api.interceptors.request.use(
  (config) => {
    // On récupère le token stocké (souvent dans le localStorage)
    const token = localStorage.getItem('auth_token');
    
    if (token) {
      // On l'ajoute aux headers de la configuration
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;