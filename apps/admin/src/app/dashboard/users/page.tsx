'use client';

import { FREE_CLIENT_LISTING_LIMIT, FREE_CLIENT_NEW_LISTING_LIMIT } from '@offroad/shared';
import { Calendar, Loader2, MapPin, Package, Pencil, Phone, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { PasswordInput } from '@/components/ui/password-input';
import { adminApi } from '@/lib/api';
import { ADMIN_LIST_PAGE_SIZE, useInfiniteScrollList } from '@/lib/use-infinite-scroll-list';

type UserRow = {
  id: string;
  phone: string;
  email?: string | null;
  name: string;
  role: string;
  city?: string | null;
  maxActiveListings?: number | null;
  maxActiveNewListings?: number | null;
  activeListingCount?: number;
  activeNewListingCount?: number;
  effectiveListingLimit?: number;
  effectiveNewListingLimit?: number;
  defaultListingLimit?: number;
  defaultNewListingLimit?: number;
  createdAt: string;
};

const emptyForm = {
  phone: '',
  email: '',
  name: '',
  password: '',
  city: '',
  role: 'CLIENT',
  maxActiveListings: '',
  maxActiveNewListings: '',
};

export default function AdminUsersPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  const fetchPage = useCallback(
    async (page: number) => {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(ADMIN_LIST_PAGE_SIZE),
      };
      if (search) params.search = search;
      const res = await adminApi.users(params);
      return { items: res.users as UserRow[], totalPages: res.totalPages };
    },
    [search],
  );

  const {
    items: users,
    initialLoading,
    loadingMore,
    hasMore,
    sentinelRef,
  } = useInfiniteScrollList<UserRow>({
    fetchPage,
    deps: [search, reloadToken],
  });

  const reload = () => setReloadToken((token) => token + 1);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (user: UserRow) => {
    setEditingId(user.id);
    setForm({
      phone: user.phone,
      email: user.email ?? '',
      name: user.name,
      password: '',
      city: user.city ?? '',
      role: user.role,
      maxActiveListings: user.maxActiveListings != null ? String(user.maxActiveListings) : '',
      maxActiveNewListings:
        user.maxActiveNewListings != null ? String(user.maxActiveNewListings) : '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const wasEditing = Boolean(editingId);
    try {
      if (editingId) {
        const payload: Record<string, string | number | null> = {
          phone: form.phone.trim(),
          email: form.email.trim(),
          name: form.name.trim(),
          city: form.city.trim() || null,
          role: form.role,
        };
        if (form.password.trim()) payload.password = form.password;
        payload.maxActiveListings = form.maxActiveListings.trim()
          ? Number(form.maxActiveListings)
          : null;
        payload.maxActiveNewListings = form.maxActiveNewListings.trim()
          ? Number(form.maxActiveNewListings)
          : null;
        await adminApi.updateUser(editingId, payload);
      } else {
        const createPayload: Parameters<typeof adminApi.createUser>[0] & {
          maxActiveListings?: number;
          maxActiveNewListings?: number;
        } = {
          phone: form.phone.trim(),
          email: form.email.trim(),
          name: form.name.trim(),
          password: form.password,
          city: form.city.trim() || undefined,
          role: form.role,
        };
        if (form.maxActiveListings.trim()) {
          createPayload.maxActiveListings = Number(form.maxActiveListings);
        }
        if (form.maxActiveNewListings.trim()) {
          createPayload.maxActiveNewListings = Number(form.maxActiveNewListings);
        }
        await adminApi.createUser(createPayload);
      }
      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
      toast.success(wasEditing ? 'کاربر به‌روزرسانی شد' : 'کاربر ایجاد شد');
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'خطا در ذخیره');
    }
  };

  const handleDelete = async (user: UserRow) => {
    if (!confirm(`حذف کاربر «${user.name}»؟`)) return;
    try {
      await adminApi.deleteUser(user.id);
      toast.success('کاربر حذف شد');
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'خطا در حذف');
    }
  };

  const formatListingQuota = (user: UserRow) => {
    const active = user.activeListingCount ?? 0;
    const limit = user.effectiveListingLimit ?? FREE_CLIENT_LISTING_LIMIT;
    const custom = user.maxActiveListings != null;
    return `${active.toLocaleString('fa-IR')}/${limit.toLocaleString('fa-IR')}${custom ? ' (ویژه)' : ''}`;
  };

  const formatNewListingQuota = (user: UserRow) => {
    const active = user.activeNewListingCount ?? 0;
    const limit = user.effectiveNewListingLimit ?? FREE_CLIENT_NEW_LISTING_LIMIT;
    const custom = user.maxActiveNewListings != null;
    return `${active.toLocaleString('fa-IR')}/${limit.toLocaleString('fa-IR')}${custom ? ' (ویژه)' : ''}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">مدیریت کاربران</h1>
        <button
          type="button"
          onClick={openCreate}
          className="bg-primary flex items-center gap-2 rounded-sm px-4 py-2 text-sm text-white"
        >
          <Plus className="h-4 w-4" />
          کاربر جدید
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              setSearch(searchInput.trim());
            }
          }}
          placeholder="جستجو بر اساس نام، ایمیل یا شماره موبایل…"
          className="min-w-[240px] flex-1 rounded-md border px-3 py-2 text-sm"
        />
        <button
          type="button"
          disabled={initialLoading}
          onClick={() => setSearch(searchInput.trim())}
          className="bg-primary rounded-md px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
        >
          {initialLoading ? 'در حال جستجو…' : 'جستجو'}
        </button>
        {search ? (
          <button
            type="button"
            onClick={() => {
              setSearchInput('');
              setSearch('');
            }}
            className="rounded-md border px-4 py-2 text-sm"
          >
            پاک کردن
          </button>
        ) : null}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-white p-4">
          <h2 className="font-semibold">{editingId ? 'ویرایش کاربر' : 'کاربر جدید'}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-gray-600">نام</span>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-sm border px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-gray-600">شماره موبایل</span>
              <input
                required
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full rounded-sm border px-3 py-2 ltr text-left"
                dir="ltr"
                placeholder="09xxxxxxxxx"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-gray-600">ایمیل</span>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full rounded-sm border px-3 py-2 ltr text-left"
                dir="ltr"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-gray-600">شهر</span>
              <input
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                className="w-full rounded-sm border px-3 py-2"
              />
            </label>
            <label className="block text-sm" htmlFor="password">
              <span className="mb-1 block text-gray-600">
                رمز عبور {editingId ? '(خالی = بدون تغییر)' : ''}
              </span>
              <PasswordInput
                required={!editingId}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                minLength={6}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-gray-600">نقش</span>
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                className="w-full rounded-sm border px-3 py-2"
              >
                <option value="CLIENT">کاربر</option>
                <option value="ADMIN">مدیر</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-gray-600">حداکثر آگهی فعال رایگان</span>
              <input
                type="number"
                min={1}
                max={999}
                value={form.maxActiveListings}
                onChange={(e) => setForm((f) => ({ ...f, maxActiveListings: e.target.value }))}
                placeholder={`پیش‌فرض (${FREE_CLIENT_LISTING_LIMIT})`}
                className="w-full rounded-sm border px-3 py-2 ltr text-left"
                dir="ltr"
              />
              <span className="mt-1 block text-xs text-gray-500">
                خالی = پیش‌فرض ({FREE_CLIENT_LISTING_LIMIT}). بیش از سقف = هزینه ثبت. قابل تنظیم ۱ تا
                ۹۹۹.
              </span>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-gray-600">حداکثر آگهی فعال «نو»</span>
              <input
                type="number"
                min={1}
                max={999}
                value={form.maxActiveNewListings}
                onChange={(e) => setForm((f) => ({ ...f, maxActiveNewListings: e.target.value }))}
                placeholder={`پیش‌فرض (${FREE_CLIENT_NEW_LISTING_LIMIT})`}
                className="w-full rounded-sm border px-3 py-2 ltr text-left"
                dir="ltr"
              />
              <span className="mt-1 block text-xs text-gray-500">
                خالی = پیش‌فرض ({FREE_CLIENT_NEW_LISTING_LIMIT}). سقف سخت برای وضعیت نو — قابل تنظیم
                ۱ تا ۹۹۹.
              </span>
            </label>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-primary rounded-sm px-4 py-2 text-sm text-white">
              ذخیره
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="rounded-sm border px-4 py-2 text-sm"
            >
              انصراف
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-lg border bg-white">
        {initialLoading && users.length === 0 ? (
          <div className="flex justify-center px-4 py-6">
            <Loader2 className="text-primary size-6 animate-spin" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-right">نام</th>
                <th className="px-4 py-3 text-right">شماره موبایل</th>
                <th className="px-4 py-3 text-right">ایمیل</th>
                <th className="px-4 py-3 text-right">شهر</th>
                <th className="px-4 py-3 text-right">آگهی فعال</th>
                <th className="px-4 py-3 text-right">آگهی نو</th>
                <th className="px-4 py-3 text-right">نقش</th>
                <th className="px-4 py-3 text-right">تاریخ ثبت نام</th>
                <th className="px-4 py-3 text-right">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">
                    <Link
                      href={`/dashboard/users/${u.id}/products`}
                      className="text-primary hover:underline"
                    >
                      {u.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-xs" dir="ltr">
                      <Phone className="h-3 w-3" />
                      {u.phone}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs ltr text-left" dir="ltr">
                    {u.email ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    {u.city ? (
                      <span className="flex items-center gap-1 text-xs">
                        <MapPin className="h-3 w-3" />
                        {u.city}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">{formatListingQuota(u)}</td>
                  <td className="px-4 py-3 text-xs">{formatNewListingQuota(u)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}
                    >
                      {u.role === 'ADMIN' ? 'مدیر' : 'کاربر'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(u.createdAt).toLocaleDateString('fa-IR')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Link
                        href={`/dashboard/users/${u.id}/products`}
                        className="rounded p-1 text-blue-600 hover:bg-blue-50"
                        title="آگهی‌های کاربر"
                      >
                        <Package className="h-4 w-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => openEdit(u)}
                        className="rounded p-1 text-gray-600 hover:bg-gray-100"
                        title="ویرایش"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(u)}
                        className="rounded p-1 text-red-600 hover:bg-red-50"
                        title="حذف"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {loadingMore ? (
        <div className="flex justify-center py-3">
          <Loader2 className="text-muted-foreground size-5 animate-spin" />
        </div>
      ) : null}

      {hasMore ? <div ref={sentinelRef} className="h-1" aria-hidden /> : null}
    </div>
  );
}
