import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import { fileURLToPath } from 'url';
import path from 'path';

// Required for resolving __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({
          buffer: true,
          process: true,
        }),
      ],
    },
  },
  resolve: {
    alias: {
      buffer: path.resolve(__dirname, 'node_modules/buffer/'),
      process: path.resolve(__dirname, 'node_modules/process/browser.js'),
    },
  },
  define: {
    'process.env': {}, // Prevent undefined errors in some packages
  },
});
