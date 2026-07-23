import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react';
            }
            if (id.includes('framer-motion') || id.includes('lucide-react') || id.includes('date-fns')) {
              return 'vendor-ui';
            }
            return 'vendor';
          }
          // Isolate auth-related logic
          if (id.includes('/services/authService') || id.includes('/data/authData')) {
            return 'auth-core';
          }
        },
      },
    },
  },
});