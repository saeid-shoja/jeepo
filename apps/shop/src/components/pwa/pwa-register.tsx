'use client';

import { useEffect } from 'react';

/** Registers the PWA service worker (required for push notifications and install). */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const register = () => {
      void navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
        // Install still works via manifest on many browsers even if SW fails.
      });
    };

    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register, { once: true });
    }
  }, []);

  return null;
}
