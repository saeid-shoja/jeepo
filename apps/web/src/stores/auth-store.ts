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
  telegramId?: string | null;
  emailVerified?: boolean;
};

type AuthState = {
  user: User | null;
  loading: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  login: (identifier: string, password: string) => Promise<void>;
  register: (
    phone: string,
    name: string,
    password: string,
    email: string,
    city?: string,
    telegramId?: string,
  ) => Promise<{ email: string; maskedEmail: string; message: string }>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  resendVerification: (email: string) => Promise<string>;
  logout: () => void;
  patchUser: (data: Partial<Pick<User, 'name' | 'city' | 'telegramId'>>) => void;
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

  login: async (identifier, password) => {
    const res = await api.auth.login({ identifier: identifier.trim(), password });
    localStorage.setItem('token', res.token);
    set({ user: res.user });
  },

  register: async (phone, name, password, email, city, telegramId) => {
    const normalizedTelegram = telegramId?.trim().replace(/^@/, '') || undefined;
    const res = await api.auth.register({
      phone: phone.trim(),
      name: name.trim(),
      password,
      email: email.trim().toLowerCase(),
      city: city?.trim() ?? '',
      telegramId: normalizedTelegram,
    });
    return {
      email: res.email,
      maskedEmail: res.maskedEmail,
      message: res.message,
    };
  },

  verifyEmail: async (email, code) => {
    const res = await api.auth.verifyEmail({ email, code });
    localStorage.setItem('token', res.token);
    set({ user: res.user });
  },

  resendVerification: async (email) => {
    const res = await api.auth.resendVerification({ email });
    return res.message;
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null });
  },

  patchUser: (data) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...data } : null,
    }));
  },
}));

/** Convenience hook matching previous context API */
export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const verifyEmail = useAuthStore((s) => s.verifyEmail);
  const resendVerification = useAuthStore((s) => s.resendVerification);
  const logout = useAuthStore((s) => s.logout);
  const patchUser = useAuthStore((s) => s.patchUser);
  return { user, loading, login, register, verifyEmail, resendVerification, logout, patchUser };
}
