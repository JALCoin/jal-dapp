// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import inject from '@rollup/plugin-inject';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    react(),
    // Node core polyfills for browser builds (process, Buffer, crypto, etc.)
    nodePolyfills({
      protocolImports: true, // allow node:crypto style imports if any dep uses them
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
      // vm: 'rollup-plugin-node-polyfills/polyfills/vm', // only if a dep complains about "vm"
    },
  },
  define: {
    // Many wallet deps expect a Node-like global
    global: 'globalThis',
  },
  optimizeDeps: {
    // Make sure these are pre-bundled so they’re available early
    include: ['buffer', 'process'],
  },
  build: {
    rollupOptions: {
      plugins: [
        // Ensure Buffer/process are available as globals in bundles
        inject({
          Buffer: ['buffer', 'Buffer'],
          process: 'process',
        }),
      ],
    },
  },
});
