/** Admin panel section keys — must match sidebar routes and API @AdminPermission decorators. */
export const ADMIN_PERMISSIONS = [
  { key: 'dashboard', label: 'داشبورد', href: '/dashboard' },
  { key: 'products', label: 'محصولات', href: '/dashboard/products' },
  { key: 'categories', label: 'دسته‌بندی‌ها', href: '/dashboard/categories' },
  { key: 'blog', label: 'وبلاگ', href: '/dashboard/blog' },
  { key: 'users', label: 'کاربران', href: '/dashboard/users' },
  { key: 'orders', label: 'سفارشات', href: '/dashboard/orders' },
  { key: 'messages', label: 'پیام‌ها', href: '/dashboard/messages' },
] as const;

export type AdminPermissionKey = (typeof ADMIN_PERMISSIONS)[number]['key'];

export const ALL_ADMIN_PERMISSION_KEYS: AdminPermissionKey[] = ADMIN_PERMISSIONS.map((p) => p.key);

export type AdminAccessProfile = {
  id: string;
  name: string;
  role: string;
  isSuperAdmin: boolean;
  adminPermissions: AdminPermissionKey[];
  /** Effective permissions for UI (super admin = all keys). */
  effectivePermissions: AdminPermissionKey[];
};

export function isAdminPermissionKey(value: string): value is AdminPermissionKey {
  return (ALL_ADMIN_PERMISSION_KEYS as readonly string[]).includes(value);
}

export function sanitizeAdminPermissions(values?: string[] | null): AdminPermissionKey[] {
  if (!values?.length) return [];
  return values.filter(isAdminPermissionKey);
}

export function resolveEffectiveAdminPermissions(user: {
  role?: string;
  isSuperAdmin?: boolean;
  adminPermissions?: string[] | null;
  adminAccessConfigured?: boolean;
}): AdminPermissionKey[] {
  if (user.role !== 'ADMIN') return [];
  if (user.isSuperAdmin) return [...ALL_ADMIN_PERMISSION_KEYS];
  if (!user.adminAccessConfigured) return [...ALL_ADMIN_PERMISSION_KEYS];
  return sanitizeAdminPermissions(user.adminPermissions);
}

export function hasAdminPermission(
  user: {
    role?: string;
    isSuperAdmin?: boolean;
    adminPermissions?: string[] | null;
    adminAccessConfigured?: boolean;
    effectivePermissions?: AdminPermissionKey[];
  },
  permission: AdminPermissionKey,
): boolean {
  if (user.effectivePermissions?.length !== undefined) {
    return user.effectivePermissions.includes(permission);
  }
  return resolveEffectiveAdminPermissions(user).includes(permission);
}

/** Map dashboard pathname to required permission (null = always allowed when authenticated). */
export function adminPathPermission(pathname: string): AdminPermissionKey | null {
  if (pathname === '/dashboard' || pathname === '/dashboard/') return 'dashboard';
  for (const item of ADMIN_PERMISSIONS) {
    if (item.href !== '/dashboard' && pathname.startsWith(item.href)) {
      return item.key;
    }
  }
  return null;
}

export function firstAllowedAdminPath(effectivePermissions: AdminPermissionKey[]): string | null {
  for (const item of ADMIN_PERMISSIONS) {
    if (effectivePermissions.includes(item.key)) return item.href;
  }
  return null;
}
