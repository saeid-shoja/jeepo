'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import { Phone, MapPin, Calendar } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    adminApi.users().then(setUsers).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">مدیریت کاربران</h1>
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-right">نام</th>
              <th className="px-4 py-3 text-right">شماره موبایل</th>
              <th className="px-4 py-3 text-right">شهر</th>
              <th className="px-4 py-3 text-right">نقش</th>
              <th className="px-4 py-3 text-right">تاریخ ثبت نام</th>
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
                  <span className={`rounded-full px-2 py-0.5 text-xs ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                    {u.role === 'ADMIN' ? 'مدیر' : 'کاربر'}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(u.createdAt).toLocaleDateString('fa-IR')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
