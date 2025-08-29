// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import inject from '@rollup/plugin-inject';
import nodePolyfills from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      globals: { Buffer: true, process: true }, // add Buffer/process shims
      protocolImports: true,
    }),
  ],
  resolve: {
    alias: {
      buffer: 'buffer',
      stream: 'stream-browserify',
      process: 'process',
      util: 'util',
      crypto: 'crypto-browserify',
      path: 'path-browserify',
      // vm: 'rollup-plugin-node-polyfills/polyfills/vm', // uncomment if needed
    },
  },
  define: {
    global: 'globalThis',
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
      ],
    },
  },
});
