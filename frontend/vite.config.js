import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  server: {
    port: 3000,
    // Proxy /api requests to the backend during development.
    // In production, configure your reverse proxy (Nginx, Caddy, etc.) instead.
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  build: {
    // Disable source maps in production builds to avoid exposing source code.
    sourcemap: false,
    // Raise the chunk-size warning threshold slightly for this app.
    chunkSizeWarningLimit: 800,
  },
});
