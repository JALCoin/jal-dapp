export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  build: {
    sourcemap: true, // <== add this
    rollupOptions: {
      plugins: [rollupNodePolyFill()],
    },
  },
});
