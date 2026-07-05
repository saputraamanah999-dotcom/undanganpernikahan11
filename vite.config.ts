import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Only treat index.html as entry — prevents Vite from scanning skills/ folder
  // (which contains unrelated HTML files that import missing deps like "three")
  optimizeDeps: {
    entries: ['index.html'],
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    fs: {
      // Restrict file serving to project root only (exclude skills/, upload/, etc.)
      allow: ['.'],
    },
    // Don't watch the skills/upload folders
    watch: {
      ignored: ['**/skills/**', '**/upload/**', '**/download/**', '**/tool-results/**', '**/.git/**'],
    },
  },
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          'firebase-vendor': ['firebase/app', 'firebase/firestore', 'firebase/auth'],
          'motion-vendor': ['motion/react'],
          'react-vendor': ['react', 'react-dom'],
        },
      },
    },
  },
})
