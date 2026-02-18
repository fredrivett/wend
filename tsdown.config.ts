import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/cli/index.ts'],
  format: ['esm'],
  dts: true,
  clean: false,
  shims: true, // Add Node.js shims for __dirname, etc.
});
