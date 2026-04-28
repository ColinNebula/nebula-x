import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// Plugin to exclude large files from build
const excludeLargeFiles = () => ({
  name: 'exclude-large-files',
  generateBundle(options, bundle) {
    // Remove large MP4 files from the bundle
    for (const fileName in bundle) {
      if (fileName.endsWith('.mp4') && bundle[fileName].type === 'asset') {
        delete bundle[fileName];
        console.log(`Excluded large file from build: ${fileName}`);
      }
    }
  }
});

export default defineConfig({
  plugins: [
    react(),
    excludeLargeFiles()
  ],
  base: '/',
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
      },
      // Mark optional WASM module as external (loaded at runtime if available)
      external: ['/game_physics.js']
    },
    chunkSizeWarningLimit: 1000 // Increase limit to 1000 kB to reduce warnings
  }
})
