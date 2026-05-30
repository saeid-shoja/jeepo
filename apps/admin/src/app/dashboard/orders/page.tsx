'use client';

import { formatPrice } from '@offroad/shared';
import { useEffect, useState } from 'react';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);

  const fetchOrders = async () => {
    const token = localStorage.getItem('token');
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
    try {
      const res = await fetch(`${API_URL}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setOrders(data);
    } catch {}
  };

  useEffect(() => {
    void fetchOrders();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">مدیریت سفارشات</h1>
      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-right">شماره</th>
              <th className="px-4 py-3 text-right">کاربر</th>
              <th className="px-4 py-3 text-right">تعداد اقلام</th>
              <th className="px-4 py-3 text-right">مبلغ کل</th>
              <th className="px-4 py-3 text-right">وضعیت</th>
              <th className="px-4 py-3 text-right">تاریخ</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{o.id.slice(0, 8)}...</td>
                <td className="px-4 py-3">{o.user?.name || 'نامشخص'}</td>
                <td className="px-4 py-3">{o.items?.length || 0}</td>
                <td className="px-4 py-3 font-medium text-primary">{formatPrice(o.total)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      o.status === 'COMPLETED'
                        ? 'bg-green-100 text-green-700'
                        : o.status === 'PENDING'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {o.status === 'COMPLETED'
                      ? 'تکمیل شده'
                      : o.status === 'PENDING'
                        ? 'در انتظار'
                        : o.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {new Date(o.createdAt).toLocaleDateString('fa-IR')}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  سفارشی یافت نشد
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
