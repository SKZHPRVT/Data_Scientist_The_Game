import { defineConfig } from 'vite';

export default defineConfig({
  base: '/Data_Scientist_The_Game/',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 4096,
  },
  server: {
    port: 3000,
    host: true,
  },
});
