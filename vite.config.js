import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  root: './client',
  base: './',
  css: {
    postcss: './client/postcss.config.js',
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: [
            '@radix-ui/react-avatar',
            '@radix-ui/react-navigation-menu',
            '@radix-ui/react-select',
          ],
        },
      },
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    strictPort: true,
    open: false // Disable auto-open in Codespaces
  },
  preview: {
    port: 4173,
    host: '0.0.0.0',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
    },
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
});