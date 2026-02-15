import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false, // impede o erro do jsPDF.map
  },
  optimizeDeps: {
    exclude: ['jspdf'] // evita otimização bugada do esbuild
  }
})
