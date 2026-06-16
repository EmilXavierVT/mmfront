import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  preview: {
    allowedHosts: [
      'morgendagensmaaltid.dk',
      'www.morgendagensmaaltid.dk',
    ],
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://morgendagens.project-ice.dk',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
