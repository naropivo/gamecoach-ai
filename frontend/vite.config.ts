import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy только для локальной разработки
    proxy: {
      '/auth':  { target: 'http://localhost:5000', changeOrigin: true },
      '/chat':  { target: 'http://localhost:5000', changeOrigin: true },
      '/admin': { target: 'http://localhost:5000', changeOrigin: true },
    },
  },
})
