import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Registrasi Service Worker PWA untuk offline caching
registerSW({
  immediate: true,
  onOfflineReady() {
    console.log('[PWA] Cyber Pursuit siap dimainkan secara offline!');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
