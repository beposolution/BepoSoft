import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@ckeditor': path.resolve(__dirname, 'node_modules/@ckeditor'),
    },
  },
  optimizeDeps: {
    include: [
      "@ckeditor/ckeditor5-core",
      "@ckeditor/ckeditor5-react",
      "@ckeditor/ckeditor5-build-classic",
      "@ckeditor/ckeditor5-watchdog",
      "@ckeditor/ckeditor5-engine"
    ],
  },
  build: {
    rollupOptions: {
      external: [],
    },
  },
});
