import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  envPrefix: ['VITE_', 'EXPO_PUBLIC_'],
  worker: {
    format: 'es'
  },
  optimizeDeps: {
    // Keep react-map-gl's dynamic Mapbox import and code-split workers out of the dev prebundle.
    exclude: ['mapbox-gl', 'react-map-gl/mapbox']
  },
  resolve: {
    alias: [
      // Keep every react-map-gl entry on Mapbox's code-split ESM build.
      { find: /^mapbox-gl$/, replacement: 'mapbox-gl/esm' },
      { find: '@shared', replacement: fileURLToPath(new URL('./src/shared', import.meta.url)) },
      { find: '@features', replacement: fileURLToPath(new URL('./src/features', import.meta.url)) }
    ]
  }
});
