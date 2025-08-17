import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const repo = 'drill-infinite-threads' // GitHub Pages base path

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? `/${repo}/` : '/',
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
}))
