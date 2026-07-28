'use client';

import { create } from 'zustand';
import { api } from '@/lib/api';

type ChatsUnreadState = {
  count: number;
  refresh: () => Promise<void>;
  reset: () => void;
};

export const useChatsUnreadStore = create<ChatsUnreadState>((set) => ({
  count: 0,

  reset: () => set({ count: 0 }),

  refresh: async () => {
    try {
      const res = await api.productChats.unreadCount();
      set({ count: res.count });
    } catch {
      set({ count: 0 });
    }
  },
}));
