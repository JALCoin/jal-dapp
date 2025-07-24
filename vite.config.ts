import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {}, // No Node polyfills needed for browser build
  },
  optimizeDeps: {
    include: [], // Remove polyfills from dependency optimization
  },
  build: {
    rollupOptions: {
      plugins: [], // Removed rollupNodePolyFill()
    },
  },
});
