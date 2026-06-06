'use client';

import { create } from 'zustand';
import { api } from '@/lib/api';

export type User = {
  id: string;
  phone: string;
  email?: string | null;
  name: string;
  role: string;
  city?: string;
};

type AuthState = {
  user: User | null;
  loading: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  login: (phone: string, password: string) => Promise<void>;
  register: (
    phone: string,
    name: string,
    password: string,
    email: string,
    city?: string,
  ) => Promise<void>;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  hydrated: false,

  hydrate: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ user: null, loading: false, hydrated: true });
      return;
    }
    try {
      const user = await api.auth.profile();
      set({ user, loading: false, hydrated: true });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, loading: false, hydrated: true });
    }
  },

  login: async (phone, password) => {
    const res = await api.auth.login({ phone, password });
    localStorage.setItem('token', res.token);
    set({ user: res.user });
  },

  register: async (phone, name, password, email, city) => {
    const res = await api.auth.register({ phone, name, password, email, city });
    localStorage.setItem('token', res.token);
    set({ user: res.user });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null });
  },
}));

/** Convenience hook matching previous context API */
export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const logout = useAuthStore((s) => s.logout);
  return { user, loading, login, register, logout };
}
