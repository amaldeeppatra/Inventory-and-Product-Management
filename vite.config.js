import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      // Proxy requests from /api to your backend server
      '/api': {
        target: 'http://localhost:5000', // Your backend server's address
        changeOrigin: true,
        // secure: false, // if your backend is not https
      }
    }
  },
})