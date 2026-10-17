import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

function viteHmrSilencerPlugin(): Plugin {
  return {
    name: 'vite-hmr-silencer',
    transformIndexHtml: {
      order: 'pre',
      handler(html: string) {
        return {
          html,
          tags: [
            {
              tag: 'script',
              injectTo: 'head-prepend',
              children: `
(function() {
  try {
    var OrigWS = window.WebSocket;
    if (!OrigWS) return;
    function MockViteWS(url, protocols) {
      var strUrl = String(url || '');
      var isHMR =
        protocols === 'vite-hmr' ||
        protocols === 'vite-ping' ||
        (Array.isArray(protocols) && (protocols.indexOf('vite-hmr') !== -1 || protocols.indexOf('vite-ping') !== -1)) ||
        strUrl.indexOf('vite-hmr') !== -1 ||
        strUrl.indexOf('vite-ping') !== -1;

      if (isHMR) {
        var self = new EventTarget();
        self.url = strUrl;
        self.protocols = protocols;
        self.protocol = typeof protocols === 'string' ? protocols : 'vite-hmr';
        self.readyState = 1;
        self.CONNECTING = 0;
        self.OPEN = 1;
        self.CLOSING = 2;
        self.CLOSED = 3;
        self.binaryType = 'blob';
        self.bufferedAmount = 0;
        self.extensions = '';
        self.onopen = null;
        self.onclose = null;
        self.onerror = null;
        self.onmessage = null;
        self.send = function() {};
        self.close = function() {
          self.readyState = 3;
          var ev = new Event('close');
          self.dispatchEvent(ev);
          if (typeof self.onclose === 'function') self.onclose(ev);
        };
        Promise.resolve().then(function() {
          var ev = new Event('open');
          self.dispatchEvent(ev);
          if (typeof self.onopen === 'function') self.onopen(ev);
        });
        return self;
      }
      return new OrigWS(url, protocols);
    }
    MockViteWS.prototype = OrigWS.prototype;
    MockViteWS.CONNECTING = 0;
    MockViteWS.OPEN = 1;
    MockViteWS.CLOSING = 2;
    MockViteWS.CLOSED = 3;
    window.WebSocket = MockViteWS;
  } catch (e) {}
})();
`.trim(),
            },
          ],
        };
      },
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      viteHmrSilencerPlugin(),
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png', 'pwa-maskable-512x512.png', 'cyber_pursuit_logo.jpg'],
        manifest: {
          id: '/',
          name: 'Escape the Police: Cyber Pursuit',
          short_name: 'CyberPursuit',
          description: 'Game balap retro-futuristik arcade melarikan diri dari kejaran polisi dengan sinkronisasi cloud real-time, online & offline.',
          theme_color: '#070814',
          background_color: '#070814',
          display: 'standalone',
          orientation: 'any',
          start_url: '/',
          scope: '/',
          categories: ['games', 'arcade', 'racing'],
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,jpg,svg,woff,woff2,json}'],
          navigateFallback: '/index.html',
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'game-assets-cache',
                expiration: {
                  maxEntries: 60,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^\/api\/.*$/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                networkTimeoutSeconds: 2,
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 60 * 60 * 24,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
