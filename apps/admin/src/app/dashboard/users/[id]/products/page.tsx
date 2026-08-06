'use client';

import { formatPrice } from '@offroad/shared';
import { ArrowRight, CheckCircle, Gavel, Shield, TrendingUp, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { adminApi } from '@/lib/api';

type UserInfo = {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  city?: string | null;
};

export default function UserProductsPage() {
  const params = useParams<{ id: string }>();
  const userId = params.id;

  const [user, setUser] = useState<UserInfo | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [guaranteeing, setGuaranteeing] = useState(false);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    adminApi
      .userProducts(userId, { page: String(page), limit: '20' })
      .then((res) => {
        setUser(res.user);
        setProducts(res.products);
        setTotalPages(res.totalPages);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : 'بارگذاری ناموفق بود'))
      .finally(() => setLoading(false));
  }, [userId, page]);

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

  const handleGuaranteeToggle = async (product: {
    id: string;
    title: string;
    hasGuarantee?: boolean;
    advertiser?: string;
    isAuction?: boolean;
  }) => {
    if (product.advertiser !== 'CLIENT' || product.isAuction) {
      toast.error('تضمین فقط برای آگهی‌های کاربری غیرمزایده است');
      return;
    }
    const enabled = !product.hasGuarantee;
    const ok = window.confirm(
      enabled
        ? `بج تضمین فروشگاه برای «${product.title}» اعمال شود؟`
        : `بج تضمین فروشگاه از «${product.title}» برداشته شود؟`,
    );
    if (!ok) return;
    try {
      await adminApi.setProductsGuarantee({ enabled, productId: product.id });
      toast.success(enabled ? 'تضمین اعمال شد' : 'تضمین برداشته شد');
      fetchProducts();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'خطا در به‌روزرسانی تضمین');
    }
  };

  const handleUserGuarantee = async (enabled: boolean) => {
    const label = enabled ? 'اعمال' : 'برداشتن';
    const ok = window.confirm(`${label} بج تضمین فروشگاه برای همه آگهی‌های کاربری این شخص؟`);
    if (!ok) return;
    setGuaranteeing(true);
    try {
      const result = await adminApi.setProductsGuarantee({ enabled, userId });
      toast.success(
        `${result.updated.toLocaleString('fa-IR')} آگهی ${enabled ? 'تضمین شد' : 'از تضمین خارج شد'}`,
      );
      fetchProducts();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'خطا در به‌روزرسانی تضمین');
    } finally {
      setGuaranteeing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/dashboard/users"
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
        >
          <ArrowRight className="size-4" />
          بازگشت به کاربران
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">آگهی‌های {user?.name ?? 'کاربر'}</h1>
          {user && (
            <p className="mt-1 text-sm text-gray-500" dir="ltr">
              {user.phone}
              {user.email ? ` · ${user.email}` : ''}
              {user.city ? ` · ${user.city}` : ''}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={guaranteeing}
            onClick={() => handleUserGuarantee(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50"
          >
            <Shield className="size-4" />
            تضمین همه آگهی‌ها
          </button>
          <button
            type="button"
            disabled={guaranteeing}
            onClick={() => handleUserGuarantee(false)}
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            برداشتن تضمین همه
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white">
        {loading ? (
          <p className="px-4 py-6 text-sm text-gray-500">در حال بارگذاری…</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-right">محصول</th>
                <th className="px-4 py-3 text-right">قیمت</th>
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
                    <p className="text-xs text-gray-500">{p.category?.name ?? '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-primary">{formatPrice(p.price)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${p.advertiser === 'SHOP' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}
                    >
                      {p.advertiser === 'SHOP' ? 'فروشگاه' : 'کاربری'}
                    </span>
                  </td>
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
                      {p.advertiser === 'CLIENT' && !p.isAuction ? (
                        <button
                          type="button"
                          onClick={() => handleGuaranteeToggle(p)}
                          className={`rounded px-2 py-1 text-xs ${
                            p.hasGuarantee
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                          title={p.hasGuarantee ? 'برداشتن تضمین' : 'اعمال تضمین فروشگاه'}
                        >
                          <Shield className="inline size-3.5" />
                        </button>
                      ) : null}
                      {p.status === 'PENDING' ? (
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
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    آگهی‌ای ثبت نشده است
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
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
