import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Required for GitHub Pages project site: https://<user>.github.io/noreaster/
  base: '/noreaster/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
