// Service Worker Registration for CareBridge AI PWA

export function registerSW() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[CareBridge AI PWA] Service Worker registered:', reg.scope);

          // Check for worker updates
          reg.onupdatefound = () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    console.log('[CareBridge AI PWA] New update available.');
                    window.dispatchEvent(new CustomEvent('pwa-update-available'));
                  } else {
                    console.log('[CareBridge AI PWA] Content cached for offline use.');
                  }
                }
              };
            }
          };
        })
        .catch((err) => {
          console.warn('[CareBridge AI PWA] Service Worker registration failed:', err);
        });
    });
  }
}
