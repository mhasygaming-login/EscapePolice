// Web Worker script for Escape Police
// Handles background computations, tick timers, or graceful worker fallback
self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data) return;

  if (typeof data === 'string' && data === 'ping') {
    self.postMessage('pong');
    return;
  }

  if (data.type === 'PING') {
    self.postMessage({ type: 'PONG', timestamp: Date.now() });
    return;
  }

  // Generic message handler
  self.postMessage({ type: 'ACK', received: true });
});

// Self-identify to any origin trial or service checker
self.name = 'escape-police-worker';
