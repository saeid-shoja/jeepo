'use client';

import { Calendar, MapPin, Pencil, Phone, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { adminApi } from '@/lib/api';

type UserRow = {
  id: string;
  phone: string;
  email?: string | null;
  name: string;
  role: string;
  city?: string | null;
  createdAt: string;
};

const emptyForm = {
  phone: '',
  email: '',
  name: '',
  password: '',
  city: '',
  role: 'CLIENT',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(() => {
    setLoading(true);
    adminApi
      .users()
      .then(setUsers)
      .catch((e) => toast.error(e instanceof Error ? e.message : 'خطا در بارگذاری'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const wasEditing = Boolean(editingId);
    try {
      if (editingId) {
        const payload: Record<string, string | null> = {
          phone: form.phone.trim(),
          email: form.email.trim(),
          name: form.name.trim(),
          city: form.city.trim() || null,
          role: form.role,
        };
        if (form.password.trim()) payload.password = form.password;
        await adminApi.updateUser(editingId, payload);
      } else {
        await adminApi.createUser({
          phone: form.phone.trim(),
          email: form.email.trim(),
          name: form.name.trim(),
          password: form.password,
          city: form.city.trim() || undefined,
          role: form.role,
        });
      }
      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
      toast.success(wasEditing ? 'کاربر به‌روزرسانی شد' : 'کاربر ایجاد شد');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'خطا در ذخیره');
    }
  };

  const handleDelete = async (user: UserRow) => {
    if (!confirm(`حذف کاربر «${user.name}»؟`)) return;
    try {
      await adminApi.deleteUser(user.id);
      toast.success('کاربر حذف شد');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'خطا در حذف');
    }
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
            <label className="block text-sm">
              <span className="mb-1 block text-gray-600">
                رمز عبور {editingId ? '(خالی = بدون تغییر)' : ''}
              </span>
              <input
                type="password"
                required={!editingId}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="w-full rounded-sm border px-3 py-2"
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
        {loading ? (
          <p className="px-4 py-6 text-sm text-gray-500">در حال بارگذاری…</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-right">نام</th>
                <th className="px-4 py-3 text-right">شماره موبایل</th>
                <th className="px-4 py-3 text-right">ایمیل</th>
                <th className="px-4 py-3 text-right">شهر</th>
                <th className="px-4 py-3 text-right">نقش</th>
                <th className="px-4 py-3 text-right">تاریخ ثبت نام</th>
                <th className="px-4 py-3 text-right">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
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
    </div>
  );
}
