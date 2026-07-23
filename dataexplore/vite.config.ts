import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite Configuration for DataExplorer Pro
 * Optimized for high-performance pharmacometric workflows and large data handling.
 */
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssCodeSplit: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        /**
         * Advanced Manual Chunking Strategy
         * Purpose: Minimize the entry-point bundle size and maximize browser caching.
         */
        manualChunks(id) {
          // 1. Vendor Split: Group massive third-party libraries separately
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-framework';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('recharts')) {
              return 'vendor-viz';
            }
            if (id.includes('dexie') || id.includes('dexie-react-hooks')) {
              return 'vendor-storage';
            }
            if (id.includes('jszip')) {
              return 'vendor-utils';
            }
            return 'vendor-misc';
          }
          
          // 2. Analytical Engine: Isolate WebR and terminal logic
          if (id.includes('/services/webrService') || id.includes('/components/RTerminal') || id.includes('/components/RRunner')) {
            return 'engine-r-bridge';
          }

          // 3. UI Views: Split main analytical workspace views
          if (id.includes('/components/center/')) {
            if (id.includes('PlotView')) return 'view-plotting';
            if (id.includes('TableView') || id.includes('ResultTableView')) return 'view-tabular';
            return 'view-core';
          }

          // 4. Heavy Config Panels: Sidebars and configuration overlays
          if (id.includes('/components/InstancesPanel') || id.includes('/components/Sidebar')) {
            return 'ui-navigation';
          }

          // 5. Intelligent Services: AI Assistant and Gemini logic
          if (id.includes('/services/geminiService') || id.includes('/components/AiPanel')) {
            return 'ai-intelligence';
          }

          // 6. Modal Overlays: Heavy dialogs loaded on demand
          if (id.includes('/components/ExportModal') || id.includes('/components/WorkflowView') || id.includes('/components/MissingDatasetModal')) {
            return 'ui-modals';
          }
          
          // 7. Data Layer: Static data and configuration
          if (id.includes('/data/')) {
            return 'data-static';
          }
        },
        // Asset Naming Patterns
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/main-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') ?? [];
          const extType = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            return `assets/img/[name]-[hash][extname]`;
          }
          if (/css/i.test(extType)) {
            return `assets/css/[name]-[hash][extname]`;
          }
          return `assets/[ext]/[name]-[hash][extname]`;
        }
      },
    },
    // Adjusted limit for pharmacometric analytical depth
    chunkSizeWarningLimit: 800,
  },
});