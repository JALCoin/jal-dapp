// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // allow imports like node:crypto
      protocolImports: true,
      // expose Node-ish globals expected by wallet deps
      globals: {
        Buffer: true,
        process: true,
      },
    }),
  ],
  define: {
    // some libs read `global`
    global: 'globalThis',
  },
  optimizeDeps: {
    // ensure these shims are pre-bundled for dev
    include: ['buffer', 'process'],
  },
});
