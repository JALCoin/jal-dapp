import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import rollupNodePolyfills from 'rollup-plugin-node-polyfills'; // ✅ Correct plugin

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
    'process.env': {},
  },
  resolve: {
    alias: {
      buffer: 'buffer',
      process: 'process/browser',
      stream: 'stream-browserify',
      util: 'util',
    },
  },
  optimizeDeps: {
    include: ['buffer', 'process', 'stream', 'util'],
  },
  build: {
    rollupOptions: {
      plugins: [rollupNodePolyfills()],
    },
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});
