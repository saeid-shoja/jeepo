'use client';

import { create } from 'zustand';
import { api } from '@/lib/api';

type FavoritesState = {
  ids: Record<string, true>;
  loading: boolean;
  isFavorite: (productId: string) => boolean;
  refresh: () => Promise<void>;
  reset: () => void;
  toggle: (productId: string) => Promise<boolean>;
};

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  ids: {},
  loading: false,

  isFavorite: (productId) => Boolean(get().ids[productId]),

  reset: () => set({ ids: {}, loading: false }),

  refresh: async () => {
    set({ loading: true });
    try {
      const res = await api.users.favoriteIds();
      const ids = Object.fromEntries(res.productIds.map((id) => [id, true as const]));
      set({ ids, loading: false });
    } catch {
      set({ ids: {}, loading: false });
    }
  },

  toggle: async (productId) => {
    const wasFavorite = get().isFavorite(productId);
    const nextIds = { ...get().ids };

    if (wasFavorite) {
      delete nextIds[productId];
    } else {
      nextIds[productId] = true;
    }
    set({ ids: nextIds });

    try {
      if (wasFavorite) {
        await api.users.removeFavorite(productId);
        return false;
      }
      await api.users.addFavorite(productId);
      return true;
    } catch {
      const rollbackIds = { ...get().ids };
      if (wasFavorite) {
        rollbackIds[productId] = true;
      } else {
        delete rollbackIds[productId];
      }
      set({ ids: rollbackIds });
      throw new Error('خطا در به‌روزرسانی علاقه‌مندی‌ها');
    }
  },
}));
