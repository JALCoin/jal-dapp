import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import rollupNodePolyFill from 'rollup-plugin-polyfill-node';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      buffer: 'buffer',
      process: 'process/browser',
      stream: 'stream-browserify',
      util: 'util',
    },
  },
  define: {
    global: 'globalThis', // Required for polyfills to work
  },
  optimizeDeps: {
    include: ['buffer', 'process', 'stream', 'util'],
  },
  build: {
    rollupOptions: {
      plugins: [rollupNodePolyFill()],
    },
    commonjsOptions: {
      transformMixedEsModules: true, // required for stream/util/etc to interop
    },
  },
});
