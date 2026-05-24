'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import { Package, Users, ShoppingCart, TrendingUp } from 'lucide-react';

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    adminApi.dashboard().then(setData).catch(() => {});
  }, []);

  if (!data) {
    return <div className="py-16 text-center text-gray-500">در حال بارگذاری...</div>;
  }

  const { stats, recentProducts, recentOrders } = data;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">داشبورد مدیریت</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border bg-white p-4">
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{stats.products}</p>
              <p className="text-xs text-gray-500">محصولات فروشگاه</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-secondary" />
            <div>
              <p className="text-2xl font-bold">{stats.clientProducts}</p>
              <p className="text-xs text-gray-500">آگهی کاربران</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{stats.orders}</p>
              <p className="text-xs text-gray-500">سفارشات</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-2xl font-bold">{stats.users}</p>
              <p className="text-xs text-gray-500">کاربران</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-4 font-bold">آخرین محصولات</h2>
          <div className="space-y-3">
            {recentProducts.map((p: any) => (
              <div key={p.id} className="flex items-center gap-3 border-b pb-2 text-sm">
                <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded bg-gray-100">
                  {p.images[0] ? (
                    <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-gray-400">بدون عکس</div>
                  )}
                </div>
                <div className="flex-1 truncate">
                  <p className="truncate font-medium">{p.title}</p>
                  <p className="text-xs text-gray-500">{p.category?.name} • {p.price.toLocaleString('fa-IR')} تومان</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs ${
                  p.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {p.status === 'ACTIVE' ? 'فعال' : p.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-4 font-bold">آخرین سفارشات</h2>
          <div className="space-y-3">
            {recentOrders.map((o: any) => (
              <div key={o.id} className="border-b pb-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{o.user?.name}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(o.createdAt).toLocaleDateString('fa-IR')}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                  <span>{o.items?.length} قلم</span>
                  <span className="font-medium text-primary">{o.total.toLocaleString('fa-IR')} تومان</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
