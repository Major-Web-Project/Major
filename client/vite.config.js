import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    strictPort: true,
    open: false // Disable auto-open in Codespaces
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    postcss: './postcss.config.js',
  },
  // Fix for crypto compatibility in Codespaces
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['react', 'react-dom']
  },
  // Additional Node.js polyfills for Codespaces
  esbuild: {
    target: 'node14'
  }
})