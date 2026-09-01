'use client';

import { ADMIN_PERMISSIONS, type AdminPermissionKey } from '@offroad/shared';

type AdminPermissionsEditorProps = {
  permissions: AdminPermissionKey[];
  isSuperAdmin: boolean;
  onPermissionsChange: (permissions: AdminPermissionKey[]) => void;
  onSuperAdminChange: (value: boolean) => void;
  disabled?: boolean;
};

export function AdminPermissionsEditor({
  permissions,
  isSuperAdmin,
  onPermissionsChange,
  onSuperAdminChange,
  disabled = false,
}: AdminPermissionsEditorProps) {
  const toggle = (key: AdminPermissionKey) => {
    if (disabled || isSuperAdmin) return;
    if (permissions.includes(key)) {
      onPermissionsChange(permissions.filter((p) => p !== key));
    } else {
      onPermissionsChange([...permissions, key]);
    }
  };

  return (
    <div className="space-y-3 rounded-lg border bg-gray-50 p-4 sm:col-span-2">
      <div>
        <h3 className="text-sm font-semibold text-gray-800">دسترسی‌های پنل مدیریت</h3>
        <p className="mt-1 text-xs text-gray-500">
          بخش‌هایی که در سایدبار برای این مدیر نمایش داده می‌شود.
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isSuperAdmin}
          disabled={disabled}
          onChange={(e) => onSuperAdminChange(e.target.checked)}
          className="size-4 rounded border-gray-300"
        />
        <span className="font-medium text-gray-800">مدیر اصلی (دسترسی کامل)</span>
      </label>

      {!isSuperAdmin && (
        <div className="grid gap-2 sm:grid-cols-2">
          {ADMIN_PERMISSIONS.map((item) => (
            <label key={item.key} className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={permissions.includes(item.key)}
                disabled={disabled}
                onChange={() => toggle(item.key)}
                className="size-4 rounded border-gray-300"
              />
              {item.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
