import { registerSW } from 'virtual:pwa-register';

const SW_UPDATE_INTERVAL_MS = 60 * 60 * 1000;

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      // Apply the update automatically if the app is backgrounded.
      if (document.visibilityState === 'hidden') {
        void updateSW(true);
        return;
      }

      if (window.confirm('A new version of tsk is ready. Reload now?')) {
        void updateSW(true);
      }
    },
    onOfflineReady() {
      console.info('tsk is ready to work offline');
    },
    onRegisteredSW(_swUrl, registration) {
      if (!registration) {
        return;
      }

      const checkForUpdates = () => {
        void registration.update().catch((error) => {
          console.error('Failed to check for service worker updates', error);
        });
      };

      checkForUpdates();
      window.setInterval(checkForUpdates, SW_UPDATE_INTERVAL_MS);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          checkForUpdates();
        }
      });
      window.addEventListener('online', checkForUpdates);
    },
    onRegisterError(error) {
      console.error('Service worker registration failed', error);
    },
  });
}
