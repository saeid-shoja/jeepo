'use client';

import { formatPrice } from '@offroad/shared';
import { CheckCircle, Shield, TrendingUp, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchProducts = () => {
    const params: Record<string, string> = { page: String(page), limit: '20' };
    if (type) params.advertiser = type;
    if (status) params.status = status;
    adminApi
      .products(params)
      .then((res) => {
        setProducts(res.products);
        setTotalPages(res.totalPages);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchProducts();
  }, [page, type, status]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await adminApi.updateProductStatus(id, newStatus);
      fetchProducts();
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">مدیریت محصولات</h1>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setPage(1);
          }}
          className="rounded-sm border px-3 py-2 text-sm outline-none"
        >
          <option value="">همه انواع</option>
          <option value="SHOP">محصولات فروشگاه</option>
          <option value="CLIENT">آگهی کاربران</option>
        </select>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="rounded-sm border px-3 py-2 text-sm outline-none"
        >
          <option value="">همه وضعیت‌ها</option>
          <option value="ACTIVE">فعال</option>
          <option value="PENDING">در انتظار بررسی</option>
          <option value="SOLD">فروخته شده</option>
          <option value="REJECTED">رد شده</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-right">محصول</th>
              <th className="px-4 py-3 text-right">قیمت</th>
              <th className="px-4 py-3 text-right">فروشنده</th>
              <th className="px-4 py-3 text-right">نوع</th>
              <th className="px-4 py-3 text-right">ویژگی‌ها</th>
              <th className="px-4 py-3 text-right">وضعیت</th>
              <th className="px-4 py-3 text-center">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium">{p.title}</p>
                  <p className="text-xs text-gray-500">{p.id.slice(0, 8)}...</p>
                </td>
                <td className="px-4 py-3 text-primary">{formatPrice(p.price)}</td>
                <td className="px-4 py-3 text-xs">{p.user?.name || 'فروشگاه'}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${(p.advertiser ?? p.type) === 'SHOP' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}
                  >
                    {(p.advertiser ?? p.type) === 'SHOP' ? 'فروشگاه' : 'کاربری'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {p.hasGuarantee && <Shield className="h-4 w-4 text-green-600" />}
                    {p.isBoosted && <TrendingUp className="h-4 w-4 text-amber-600" />}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={p.status}
                    onChange={(e) => handleStatusChange(p.id, e.target.value)}
                    className={`rounded-sm border px-2 py-1 text-xs ${
                      p.status === 'ACTIVE'
                        ? 'border-green-300 text-green-700'
                        : p.status === 'SOLD'
                          ? 'border-blue-300 text-blue-700'
                          : p.status === 'REJECTED'
                            ? 'border-red-300 text-red-700'
                            : 'border-gray-300 text-gray-600'
                    }`}
                  >
                    <option value="ACTIVE">فعال</option>
                    <option value="PENDING">در انتظار</option>
                    <option value="SOLD">فروخته شده</option>
                    <option value="REJECTED">رد شده</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex justify-center gap-1">
                    <button
                      onClick={() =>
                        handleStatusChange(p.id, p.status === 'ACTIVE' ? 'PENDING' : 'ACTIVE')
                      }
                      className="rounded p-1.5 text-gray-500 hover:bg-gray-100"
                      title={p.status === 'ACTIVE' ? 'غیرفعال' : 'فعال'}
                    >
                      {p.status === 'ACTIVE' ? (
                        <XCircle className="h-4 w-4" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  محصولی یافت نشد
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`h-9 w-9 rounded-sm text-sm ${page === p ? 'bg-primary text-white' : 'bg-white text-gray-700'}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
