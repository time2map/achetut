import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';

const DEFAULT_BACKEND_URL = 'https://achetut-back.time2map.com';

// iOS Safari can run Mapbox worker requests before the worker receives its referrer,
// which crashes on `undefined.startsWith`. Fall back to the page origin (same as the worker's).
const MAPBOX_WORKER_REFERRER = '()=>self.worker.referrer:';
function mapboxWorkerReferrerFallback(): Plugin {
  return {
    name: 'mapbox-worker-referrer-fallback',
    transform(code, id) {
      if (!id.includes('mapbox-gl/dist/esm/shared.js') || !code.includes(MAPBOX_WORKER_REFERRER)) return null;
      return {
        code: code.replace(MAPBOX_WORKER_REFERRER, '()=>self.worker.referrer||self.location.origin+"/":'),
        map: null
      };
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  return {
    plugins: [react(), tailwindcss(), mapboxWorkerReferrerFallback()],
    envPrefix: ['VITE_', 'EXPO_PUBLIC_'],
    server: {
      proxy: {
        // The backend doesn't send CORS headers for localhost, so dev requests go through Vite.
        '/api': {
          target: env.VITE_ARCHI2GO_BACK_URL || DEFAULT_BACKEND_URL,
          changeOrigin: true
        }
      }
    },
    worker: {
      format: 'es',
      plugins: () => [mapboxWorkerReferrerFallback()]
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
  };
});
