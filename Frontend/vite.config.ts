import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Indispensable pour que Docker puisse exposer le service
    port: 5173,      // Le port interne défini dans ton docker-compose
    strictPort: true,
    watch: {
      usePolling: true, // Recommandé pour Windows/WSL2 pour détecter les changements de code
    },
  },
})