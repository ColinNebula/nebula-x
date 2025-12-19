import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  base: '/nebulax/',
  server: {
    port: 5173,
    open: true,
    host: '127.0.0.1'
  },
  build: {
    outDir: 'build',
    rollupOptions: {
      output: {
        manualChunks: {
          // Split React and React-DOM into a separate vendor chunk
          'react-vendor': ['react', 'react-dom'],
          // Split the large game component into its own chunk
          'game': ['./src/components/SpaceShooter.jsx']
        }
      }
    },
    chunkSizeWarningLimit: 1000 // Increase limit to 1000 kB to reduce warnings
  }
})
