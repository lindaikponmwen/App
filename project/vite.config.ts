import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': process.env
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    cors: true,
  },
  build: {
    rollupOptions: {
      external: ['dompurify'],
      output: {
        manualChunks(id: string): string | undefined {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor.react';
            }
            if (id.includes('monaco-editor')) {
              return 'vendor.editor';
            }
            if (id.includes('framer-motion') || id.includes('lucide-react')) {
              return 'vendor.ui';
            }
            if (id.includes('webr')) {
              return 'vendor.webr';
            }
            if (id.includes('date-fns')) {
              return 'vendor.utils';
            }
            return 'vendor.other';
          }
        },
      },
    },
  },
});