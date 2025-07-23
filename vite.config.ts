import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import rollupNodePolyFill from 'rollup-plugin-polyfill-node';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis', // ✅ Required by many node-style libraries in browser
  },
  resolve: {
    alias: {
      process: 'process/browser',
      stream: 'stream-browserify',
      zlib: 'browserify-zlib',
      util: 'util',
      buffer: 'buffer',
    },
  },
  optimizeDeps: {
    include: ['buffer', 'process', 'stream', 'zlib', 'util'],
  },
  build: {
    rollupOptions: {
      plugins: [rollupNodePolyFill()],
    },
  },
});
