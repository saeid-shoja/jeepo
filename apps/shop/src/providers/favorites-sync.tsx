'use client';

import { useEffect } from 'react';
import { useAuth } from '@/stores/auth-store';
import { useFavoritesStore } from '@/stores/favorites-store';

/** Loads favorite product IDs once when the user is logged in */
export function FavoritesSync() {
  const { user } = useAuth();
  const refresh = useFavoritesStore((s) => s.refresh);
  const reset = useFavoritesStore((s) => s.reset);

  useEffect(() => {
    if (!user) {
      reset();
      return;
    }
    void refresh();
  }, [user, refresh, reset]);

  return null;
}
