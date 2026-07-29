'use client';

import { create } from 'zustand';
import { api } from '@/lib/api';

type MessagesUnreadState = {
  count: number;
  refresh: () => Promise<void>;
  reset: () => void;
};

export const useMessagesUnreadStore = create<MessagesUnreadState>((set) => ({
  count: 0,

  reset: () => set({ count: 0 }),

  refresh: async () => {
    try {
      const res = await api.users.messagesUnreadCount();
      set({ count: res.count });
    } catch {
      set({ count: 0 });
    }
  },
}));
