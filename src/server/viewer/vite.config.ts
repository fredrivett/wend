import { resolve } from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const apiPort = process.env.SYNCDOCS_API_PORT || '3457';

export default defineConfig({
  plugins: [tailwindcss(), react()],
  root: __dirname,
  base: '/',
  resolve: {
    alias: {
      '@': __dirname,
    },
  },
  build: {
    outDir: resolve(__dirname, '../../../dist/viewer-dist'),
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': {
        target: `http://localhost:${apiPort}`,
        changeOrigin: true,
      },
      '/docs': {
        target: `http://localhost:${apiPort}`,
        changeOrigin: true,
      },
    },
  },
});
