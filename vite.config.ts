import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import rollupNodePolyFill from 'rollup-plugin-polyfill-node';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Polyfills
      stream: 'rollup-plugin-node-polyfills/polyfills/stream',
      crypto: 'rollup-plugin-node-polyfills/polyfills/crypto-browserify',
      path: 'rollup-plugin-node-polyfills/polyfills/path',
      buffer: 'rollup-plugin-node-polyfills/polyfills/buffer-es6',
      process: 'rollup-plugin-node-polyfills/polyfills/process-es6',
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
      inject: [require.resolve('rollup-plugin-node-polyfills/polyfills/global')],
    },
  },
  build: {
    rollupOptions: {
      plugins: [rollupNodePolyFill()],
    },
  },
});
