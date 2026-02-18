import { resolve } from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: __dirname,
  base: '/viewer/',
  build: {
    outDir: resolve(__dirname, '../../../dist/viewer-dist'),
    emptyOutDir: true,
  },
});
