import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {

  // ✅ Charge les variables d'environnement (.env)
  const env = loadEnv(mode, process.cwd(), '');

  return {

    base: './',

    plugins: [react()],

    server: {

      host: '0.0.0.0',

      // ✅ Port du serveur Vite
      port: 5173,

      // ✅ Empêche Vite de changer automatiquement le port
      strictPort: true,

      // ✅ Proxy API dynamique
      proxy: {
        '/api': {

          // ✅ Utilise la variable du .env
          target: env.VITE_API_BASE_URL,

          // ✅ Modifie l'origine de la requête
          changeOrigin: true,

          // ✅ Ignore les problèmes SSL en développement
          secure: false,

          headers: {
            'ngrok-skip-browser-warning': 'true',
            'Accept': 'application/json',
          },
        },
      },

      // ✅ Hot Reload optimisé pour Docker
      hmr: {
        clientPort: 5173,
      },

      // ✅ Autorise les connexions externes
      allowedHosts: [
        'all',
        '.ngrok-free.app',
        '.ngrok.io',
      ],

      // ✅ Docker détecte correctement les changements
      watch: {
        usePolling: true,
      },
    },
  }
})