import { defineConfig } from 'vite';

export default defineConfig({
  base: '/data_scientist_the_game/',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 4096,
  },
  server: {
    port: 3000,
    host: true,
  },
});
