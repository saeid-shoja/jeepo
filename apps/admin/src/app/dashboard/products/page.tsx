'use client';

import { formatPrice, isAdminApprovalRequiredCategory } from '@offroad/shared';
import { CheckCircle, Gavel, Shield, Store, TrendingUp, User, XCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { adminApi } from '@/lib/api';

type ProductTab = 'shop' | 'client' | 'pending_approval' | 'auction';

const TABS: Array<{ id: ProductTab; label: string; icon: typeof Store }> = [
  { id: 'shop', label: 'محصولات فروشگاه', icon: Store },
  { id: 'client', label: 'محصولات کاربران', icon: User },
  { id: 'pending_approval', label: 'نیاز به تأیید', icon: CheckCircle },
  { id: 'auction', label: 'مزایده', icon: Gavel },
];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [tab, setTab] = useState<ProductTab>('shop');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchProducts = useCallback(() => {
    adminApi
      .products({ page: String(page), limit: '20', tab })
      .then((res) => {
        setProducts(res.products);
        setTotalPages(res.totalPages);
      })
      .catch(() => toast.error('بارگذاری محصولات ناموفق بود'));
  }, [page, tab]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await adminApi.updateProductStatus(id, newStatus);
      toast.success('وضعیت محصول به‌روزرسانی شد');
      fetchProducts();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'خطا در به‌روزرسانی وضعیت');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">مدیریت محصولات</h1>
      </div>

      <div className="flex flex-wrap gap-2 border-b pb-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setTab(id);
              setPage(1);
            }}
            className={`flex items-center gap-2 rounded-t-sm border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === id
                ? 'border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground border-transparent'
            }`}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-right">محصول</th>
              <th className="px-4 py-3 text-right">قیمت</th>
              <th className="px-4 py-3 text-right">فروشنده</th>
              {tab !== 'shop' && tab !== 'client' && <th className="px-4 py-3 text-right">نوع</th>}
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
                  <p className="text-xs text-gray-500">{p.category?.name ?? '—'}</p>
                  {p.category?.slug && isAdminApprovalRequiredCategory(p.category.slug) && (
                    <span className="mt-1 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-[10px] text-blue-800">
                      فروش خودرو/موتور
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-primary">{formatPrice(p.price)}</td>
                <td className="px-4 py-3 text-xs">{p.user?.name || 'فروشگاه'}</td>
                {tab !== 'shop' && tab !== 'client' && (
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${(p.advertiser ?? p.type) === 'SHOP' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}
                    >
                      {(p.advertiser ?? p.type) === 'SHOP' ? 'فروشگاه' : 'کاربری'}
                    </span>
                  </td>
                )}
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {p.isAuction && (
                      <Gavel className="h-4 w-4 text-violet-600" aria-label="مزایده" />
                    )}
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
                    {tab === 'pending_approval' && p.status === 'PENDING' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(p.id, 'ACTIVE')}
                          className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700"
                        >
                          تأیید
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(p.id, 'REJECTED')}
                          className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
                        >
                          رد
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
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
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td
                  colSpan={tab === 'shop' || tab === 'client' ? 6 : 7}
                  className="px-4 py-8 text-center text-gray-500"
                >
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
              type="button"
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
