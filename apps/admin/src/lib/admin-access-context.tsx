'use client';

import {
  ADMIN_PERMISSIONS,
  type AdminAccessProfile,
  type AdminPermissionKey,
  adminPathPermission,
  firstAllowedAdminPath,
} from '@offroad/shared';
import { usePathname, useRouter } from 'next/navigation';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { adminApi } from '@/lib/api';

type AdminAccessContextValue = {
  profile: AdminAccessProfile | null;
  loading: boolean;
  error: string | null;
  can: (permission: AdminPermissionKey) => boolean;
  refresh: () => Promise<void>;
  navItems: Array<(typeof ADMIN_PERMISSIONS)[number]>;
};

const AdminAccessContext = createContext<AdminAccessContextValue | null>(null);

export function AdminAccessProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<AdminAccessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const me = await adminApi.me();
      setProfile(me);
    } catch (err) {
      setProfile(null);
      // api.ts clears token and redirects on 401
      if (err instanceof Error && err.message.includes('نشست')) {
        return;
      }
      setError(err instanceof Error ? err.message : 'خطا در دریافت اطلاعات مدیر');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    refresh();
  }, [refresh, router]);

  useEffect(() => {
    if (loading || !profile) return;

    const required = adminPathPermission(pathname);
    if (!required) return;

    if (!profile.effectivePermissions.includes(required)) {
      const fallback = firstAllowedAdminPath(profile.effectivePermissions);
      if (fallback && fallback !== pathname) {
        router.replace(fallback);
      }
    }
  }, [loading, pathname, profile, router]);

  const navItems = useMemo(() => {
    if (!profile) return [];
    const allowed = new Set(profile.effectivePermissions);
    return ADMIN_PERMISSIONS.filter((item) => allowed.has(item.key));
  }, [profile]);

  const can = useCallback(
    (permission: AdminPermissionKey) => profile?.effectivePermissions.includes(permission) ?? false,
    [profile],
  );

  const value = useMemo(
    () => ({ profile, loading, error, can, refresh, navItems }),
    [profile, loading, error, can, refresh, navItems],
  );

  return <AdminAccessContext.Provider value={value}>{children}</AdminAccessContext.Provider>;
}

export function useAdminAccess() {
  const ctx = useContext(AdminAccessContext);
  if (!ctx) throw new Error('useAdminAccess must be used within AdminAccessProvider');
  return ctx;
}
