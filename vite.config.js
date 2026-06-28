import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

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

export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    excludeLargeFiles()
  ],
  base: command === 'build' ? './' : '/',
  publicDir: 'public',
  server: {
    port: 5173,
    open: true,
    host: '127.0.0.1'
  },
  build: {
    outDir: 'build',
    minify: command === 'build' ? 'esbuild' : false,
    target: 'es2020',
    esbuild: command === 'build' ? {
      drop: ['console', 'debugger']
    } : undefined,
    rollupOptions: {
      // Mark optional WASM module as external (loaded at runtime if available)
      external: ['/game_physics.js']
    },
    chunkSizeWarningLimit: 1000 // Increase limit to 1000 kB to reduce warnings
  }
}))
