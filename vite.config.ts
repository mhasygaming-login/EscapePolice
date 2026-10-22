import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

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
    base: process.env.ELECTRON_BUILD === 'true' ? './' : '/',
    plugins: [
      viteHmrSilencerPlugin(),
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
