// In major-web-project/major/Major-newly-finally-done/client/vite.config.js

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import path from "path";
import { fileURLToPath } from "url"; // <-- Import this

const __filename = fileURLToPath(import.meta.url); // <-- Add this
const __dirname = path.dirname(__filename); // <-- Add this

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/",
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          ui: [
            "@radix-ui/react-avatar",
            "@radix-ui/react-navigation-menu",
            "@radix-ui/react-select",
          ],
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      "/api": "http://localhost:5000",
    },
  },
  preview: {
    port: 4173,
    host: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // <-- This will now work correctly
    },
  },
});
