import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Charge les variables d'environnement (VITE_API_URL, etc.)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0', // Indispensable pour Docker
      port: 5173,      
      strictPort: true,
      
      // ✅ Configuration du Proxy dynamique
      proxy: {
        '/api': {
          // Utilise l'URL du .env ou l'adresse actuelle par défaut
          target: env.VITE_API_URL || 'https://5982-102-244-223-207.ngrok-free.app',
          changeOrigin: true,
          secure: false, 
          // Rewrite le prefixe si nécessaire (optionnel selon ton API Laravel)
          // rewrite: (path) => path.replace(/^\/api/, ''), 
          headers: {
            'ngrok-skip-browser-warning': 'true', // Bypass la page d'avertissement Ngrok
            'Accept': 'application/json',
          }
        }
      },

      // ✅ Hot Module Replacement (HMR) optimisé pour Docker
      hmr: {
        clientPort: 5173,
      },

      // ✅ Autorise tous les hosts pour éviter les erreurs "Invalid Host Header" avec Ngrok
      allowedHosts: [
        'all',
        '.ngrok-free.app',
        '.ngrok.io'
      ],

      // Indispensable pour que Docker détecte les changements de fichiers sur Windows/macOS
      watch: {
        usePolling: true,
      },
    },
  }
})