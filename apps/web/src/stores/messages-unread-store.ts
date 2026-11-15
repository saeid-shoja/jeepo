'use client';

import { create } from 'zustand';
import { api } from '@/lib/api';

type MessagesUnreadState = {
  count: number;
  refresh: () => Promise<void>;
  reset: () => void;
};

let refreshRequestId = 0;

export const useMessagesUnreadStore = create<MessagesUnreadState>((set) => ({
  count: 0,

  reset: () => {
    refreshRequestId += 1;
    set({ count: 0 });
  },

  refresh: async () => {
    const requestId = ++refreshRequestId;

    try {
      const res = await api.users.messagesUnreadCount();
      if (requestId === refreshRequestId) {
        set({ count: res.count });
      }
    } catch (error) {
      if (requestId === refreshRequestId) {
        console.error('Failed to refresh unread messages count:', error);
      }
    }
  },
}));
