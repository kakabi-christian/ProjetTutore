import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Charge les variables d'environnement (VITE_API_URL, etc.)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // 🚀 AJOUT CRUCIAL : Définit les chemins en relatif pour le déploiement
    base: './', 
    
    plugins: [react()],
    server: {
      host: '0.0.0.0', // Indispensable pour Docker
      port: 5173,      
      strictPort: true,
      
      // ✅ Configuration du Proxy dynamique
      proxy: {
        '/api': {
          target: env.VITE_API_URL,
          changeOrigin: true,
          secure: false, 
          headers: {
            'ngrok-skip-browser-warning': 'true', 
            'Accept': 'application/json',
          }
        }
      },

      // ✅ Hot Module Replacement (HMR) optimisé pour Docker
      hmr: {
        clientPort: 5173,
      },

      // ✅ Autorise tous les hosts
      allowedHosts: [
        'all',
        '.ngrok-free.app',
        '.ngrok.io'
      ],

      // Indispensable pour que Docker détecte les changements
      watch: {
        usePolling: true,
      },
    },
  }
})