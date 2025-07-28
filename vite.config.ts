// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import rollupNodePolyFill from 'rollup-plugin-node-polyfills';
import inject from '@rollup/plugin-inject';

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      stream: 'rollup-plugin-node-polyfills/polyfills/stream',
      util: 'rollup-plugin-node-polyfills/polyfills/util',
      buffer: 'rollup-plugin-node-polyfills/polyfills/buffer-es6',
      process: 'rollup-plugin-node-polyfills/polyfills/process-es6',
    },
  },
  optimizeDeps: {
    include: ['buffer', 'process'],
  },
  build: {
    rollupOptions: {
      plugins: [
        inject({
          Buffer: ['buffer', 'Buffer'],
          process: 'process',
        }),
        rollupNodePolyFill(),
      ],
    },
  },
});
