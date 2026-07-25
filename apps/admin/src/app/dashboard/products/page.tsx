'use client';

import { formatPrice, isAdminApprovalRequiredCategory } from '@offroad/shared';
import { CheckCircle, Gavel, Shield, Store, Tag, TrendingUp, User, XCircle } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [announcing, setAnnouncing] = useState(false);

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

  useEffect(() => {
    setSelectedIds(new Set());
  }, [tab, page]);

  const activeProducts = useMemo(() => products.filter((p) => p.status === 'ACTIVE'), [products]);
  const allActiveSelected =
    activeProducts.length > 0 && activeProducts.every((p) => selectedIds.has(p.id));

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await adminApi.updateProductStatus(id, newStatus);
      toast.success('وضعیت محصول به‌روزرسانی شد');
      fetchProducts();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'خطا در به‌روزرسانی وضعیت');
    }
  };

  const toggleSelect = (id: string, selectable: boolean) => {
    if (!selectable) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllActive = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allActiveSelected) {
        for (const p of activeProducts) next.delete(p.id);
      } else {
        for (const p of activeProducts) next.add(p.id);
      }
      return next;
    });
  };

  const handleAnnounceBestPrice = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) {
      toast.error('حداقل یک محصول فعال را انتخاب کنید');
      return;
    }

    const confirmed = window.confirm(
      `${ids.length.toLocaleString('fa-IR')} محصول به‌عنوان «قیمت مناسب» در کانال تلگرام ارسال شود؟`,
    );
    if (!confirmed) return;

    setAnnouncing(true);
    try {
      const result = await adminApi.announceBestPrice(ids);
      if (result.sent > 0) {
        toast.success(`${result.sent.toLocaleString('fa-IR')} محصول به تاپیک قیمت مناسب ارسال شد`);
      }
      if (result.failed > 0) {
        toast.error(`ارسال ${result.failed.toLocaleString('fa-IR')} محصول ناموفق بود`);
      }
      if (result.skipped > 0) {
        toast.warning(
          `${result.skipped.toLocaleString('fa-IR')} محصول رد شد (فقط محصولات فعال ارسال می‌شوند)`,
        );
      }
      if (result.sent === 0 && result.failed === 0 && result.skipped > 0) {
        toast.error('هیچ محصول فعالی برای ارسال یافت نشد');
      }
      setSelectedIds(new Set());
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'ارسال به تلگرام ناموفق بود');
    } finally {
      setAnnouncing(false);
    }
  };

  const colSpan = tab === 'shop' || tab === 'client' ? 7 : 8;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">مدیریت محصولات</h1>
        <button
          type="button"
          disabled={selectedIds.size === 0 || announcing}
          onClick={handleAnnounceBestPrice}
          className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Tag className="size-4" aria-hidden />
          {announcing
            ? 'در حال ارسال…'
            : `ارسال قیمت مناسب${selectedIds.size ? ` (${selectedIds.size.toLocaleString('fa-IR')})` : ''}`}
        </button>
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
              <th className="px-3 py-3 text-center">
                <input
                  type="checkbox"
                  checked={allActiveSelected}
                  disabled={activeProducts.length === 0}
                  onChange={toggleSelectAllActive}
                  aria-label="انتخاب همه محصولات فعال این صفحه"
                  className="size-4 accent-emerald-600"
                />
              </th>
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
            {products.map((p) => {
              const selectable = p.status === 'ACTIVE';
              return (
                <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(p.id)}
                      disabled={!selectable}
                      onChange={() => toggleSelect(p.id, selectable)}
                      aria-label={`انتخاب ${p.title}`}
                      className="size-4 accent-emerald-600 disabled:opacity-40"
                    />
                  </td>
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
              );
            })}
            {products.length === 0 && (
              <tr>
                <td colSpan={colSpan} className="px-4 py-8 text-center text-gray-500">
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
