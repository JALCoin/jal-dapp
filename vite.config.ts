import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import rollupNodePolyfills from 'rollup-plugin-node-polyfills';

// Fix: explicitly cast plugin to unknown as Plugin[]
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
    'process.env': {}, // Required for polyfills
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
      plugins: [rollupNodePolyfills() as unknown as any], // ✅ This bypasses TS typing issues
    },
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});
