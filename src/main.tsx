import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from './components/layout/ErrorBoundary';
import App from './App';
import './index.css';

// Registrasi Service Worker PWA untuk offline caching di lingkungan production secara dinamis
if (import.meta.env.PROD && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  import('virtual:pwa-register')
    .then(({ registerSW }) => {
      registerSW({
        immediate: true,
        onOfflineReady() {
          console.log('[PWA] Cyber Pursuit siap dimainkan secara offline!');
        },
      });
    })
    .catch((err) => {
      console.warn('[PWA] Service worker registration skipped:', err);
    });
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
}

