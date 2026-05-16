export function register() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('✅ Service Worker registered:', reg.scope);

          // Check for updates every 60 seconds
          setInterval(() => reg.update(), 60 * 1000);

          reg.onupdatefound = () => {
            const worker = reg.installing;
            worker.onstatechange = () => {
              if (worker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('🔄 New version available — refresh to update.');
              }
            };
          };
        })
        .catch((err) => console.error('SW registration failed:', err));
    });
  }
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((reg) => reg.unregister())
      .catch((err) => console.error(err));
  }
}