'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { subscribeToPushNotifications } from '@/lib/push-notifications';
import { useAuth } from '@/stores/auth-store';

/** Registers the PWA service worker (required for push notifications and install). */
export function PwaRegister() {
  const { user } = useAuth();

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

  useEffect(() => {
    if (!user || typeof window === 'undefined') return;
    if (
      !('Notification' in window) ||
      !('serviceWorker' in navigator) ||
      !('PushManager' in window)
    ) {
      return;
    }
    if (Notification.permission !== 'default') return;

    let cancelled = false;

    const promptForNotifications = async () => {
      try {
        const config = await api.users.pushConfig();
        if (!config.enabled || cancelled) return;

        toast.info('برای دریافت اعلان‌های پیام‌ها، اجازه اعلان‌ها را فعال کنید.', {
          duration: 10_000,
          action: {
            label: 'فعال‌سازی',
            onClick: async () => {
              await subscribeToPushNotifications();
            },
          },
        });
      } catch {
        // Ignore configuration errors; users can still activate notifications later.
      }
    };

    void promptForNotifications();

    return () => {
      cancelled = true;
    };
  }, [user]);

  return null;
}
