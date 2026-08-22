'use client';

import {
  formatPrice,
  getOrderStatusLabel,
  getProductColorLabel,
  ORDER_STATUS_TRANSITIONS,
  type OrderStatusCode,
} from '@offroad/shared';
import { Check, ChevronDown, ChevronUp, Package, Truck, X } from 'lucide-react';
import Image from 'next/image';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { adminApi } from '@/lib/api';

type OrderRow = {
  id: string;
  total: number;
  status: OrderStatusCode | string;
  address?: string | null;
  phone?: string | null;
  note?: string | null;
  paymentMethod?: string | null;
  paymentRefNumber?: string | null;
  paidAt?: string | null;
  statusChangedAt?: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    city?: string | null;
  } | null;
  items?: Array<{
    id: string;
    quantity: number;
    price: number;
    color?: string | null;
    product?: {
      id: string;
      title: string;
      advertiser?: string;
      images?: string;
      category?: { name?: string } | null;
      user?: { name?: string; phone?: string | null } | null;
    } | null;
  }>;
};

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'PENDING':
      return 'bg-amber-100 text-amber-800';
    case 'CONFIRMED':
      return 'bg-blue-100 text-blue-800';
    case 'PACKAGING':
      return 'bg-violet-100 text-violet-800';
    case 'SHIPPED':
      return 'bg-sky-100 text-sky-800';
    case 'DELIVERED':
      return 'bg-green-100 text-green-800';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

function parseImages(raw?: string): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'open' | OrderStatusCode>('open');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.orders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'بارگذاری سفارشات ناموفق بود');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  const filtered = useMemo(() => {
    if (filter === 'all') return orders;
    if (filter === 'open') {
      return orders.filter((o) => ['CONFIRMED', 'PACKAGING', 'SHIPPED'].includes(o.status));
    }
    return orders.filter((o) => o.status === filter);
  }, [orders, filter]);

  const handleStatusChange = async (order: OrderRow, next: OrderStatusCode) => {
    const label = getOrderStatusLabel(next);
    const ok = window.confirm(
      `وضعیت سفارش ${order.id.slice(-8)} به «${label}» تغییر کند؟\nایمیل به خریدار ارسال می‌شود.`,
    );
    if (!ok) return;

    setUpdatingId(order.id);
    try {
      const updated = await adminApi.updateOrderStatus(order.id, next);
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, ...updated } : o)));
      toast.success(`وضعیت به «${label}» تغییر کرد`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'خطا در تغییر وضعیت');
    } finally {
      setUpdatingId(null);
    }
  };

  const nextActions = (
    status: string,
  ): Array<{ status: OrderStatusCode; label: string; tone: string }> => {
    const allowed = ORDER_STATUS_TRANSITIONS[status as OrderStatusCode] ?? [];
    return allowed.map((s) => {
      if (s === 'PACKAGING') {
        return {
          status: s,
          label: 'تأیید و بسته‌بندی',
          tone: 'bg-green-600 text-white hover:bg-green-700',
        };
      }
      if (s === 'CANCELLED') {
        return { status: s, label: 'رد / لغو', tone: 'bg-red-600 text-white hover:bg-red-700' };
      }
      if (s === 'SHIPPED') {
        return { status: s, label: 'ارسال شد', tone: 'bg-sky-600 text-white hover:bg-sky-700' };
      }
      if (s === 'DELIVERED') {
        return {
          status: s,
          label: 'تحویل شد',
          tone: 'bg-emerald-600 text-white hover:bg-emerald-700',
        };
      }
      return {
        status: s,
        label: getOrderStatusLabel(s),
        tone: 'bg-gray-700 text-white hover:bg-gray-800',
      };
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">مدیریت سفارشات</h1>
        <button
          type="button"
          onClick={() => void fetchOrders()}
          className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
        >
          بروزرسانی
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['open', 'نیازمند اقدام'],
            ['all', 'همه'],
            ['CONFIRMED', 'در انتظار بررسی'],
            ['PACKAGING', 'بسته‌بندی'],
            ['SHIPPED', 'ارسال‌شده'],
            ['DELIVERED', 'تحویل‌شده'],
            ['CANCELLED', 'لغو‌شده'],
            ['PENDING', 'در انتظار پرداخت'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              filter === id
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-center w-10" />
              <th className="px-4 py-3 text-right">شماره</th>
              <th className="px-4 py-3 text-right">خریدار</th>
              <th className="px-4 py-3 text-right">اقلام</th>
              <th className="px-4 py-3 text-right">مبلغ</th>
              <th className="px-4 py-3 text-right">وضعیت</th>
              <th className="px-4 py-3 text-right">تاریخ</th>
              <th className="px-4 py-3 text-center">عملیات سریع</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  در حال بارگذاری…
                </td>
              </tr>
            ) : (
              filtered.map((o) => {
                const open = expandedId === o.id;
                const actions = nextActions(o.status);
                const busy = updatingId === o.id;
                return (
                  <Fragment key={o.id}>
                    <tr className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-3 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => setExpandedId(open ? null : o.id)}
                          className="rounded p-1 text-gray-500 hover:bg-gray-100"
                          aria-label={open ? 'بستن جزئیات' : 'مشاهده جزئیات'}
                        >
                          {open ? (
                            <ChevronUp className="size-4" />
                          ) : (
                            <ChevronDown className="size-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs" dir="ltr">
                        {o.id.slice(-8)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{o.user?.name || 'نامشخص'}</p>
                        <p className="text-xs text-gray-500" dir="ltr">
                          {o.user?.phone || o.phone || '—'}
                        </p>
                      </td>
                      <td className="px-4 py-3">{o.items?.length ?? 0}</td>
                      <td className="text-primary px-4 py-3 font-medium">{formatPrice(o.total)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${statusBadgeClass(o.status)}`}
                        >
                          {getOrderStatusLabel(o.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(o.createdAt).toLocaleString('fa-IR')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap justify-center gap-1">
                          {actions.map((a) => (
                            <button
                              key={a.status}
                              type="button"
                              disabled={busy}
                              onClick={() => void handleStatusChange(o, a.status)}
                              className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs disabled:opacity-50 ${a.tone}`}
                            >
                              {a.status === 'CANCELLED' ? (
                                <X className="size-3" />
                              ) : a.status === 'SHIPPED' ? (
                                <Truck className="size-3" />
                              ) : a.status === 'PACKAGING' ? (
                                <Package className="size-3" />
                              ) : (
                                <Check className="size-3" />
                              )}
                              {a.label}
                            </button>
                          ))}
                          {actions.length === 0 ? (
                            <span className="text-xs text-gray-400">—</span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                    {open ? (
                      <tr className="border-b bg-slate-50/80">
                        <td colSpan={8} className="px-4 py-4">
                          <div className="grid gap-4 lg:grid-cols-2">
                            <div className="space-y-2 rounded-lg border bg-white p-4">
                              <h3 className="font-semibold">خریدار و ارسال</h3>
                              <dl className="grid grid-cols-[7rem_1fr] gap-y-1.5 text-sm">
                                <dt className="text-gray-500">نام</dt>
                                <dd>{o.user?.name ?? '—'}</dd>
                                <dt className="text-gray-500">موبایل</dt>
                                <dd dir="ltr">{o.user?.phone ?? o.phone ?? '—'}</dd>
                                <dt className="text-gray-500">ایمیل</dt>
                                <dd dir="ltr">{o.user?.email ?? '—'}</dd>
                                <dt className="text-gray-500">شهر</dt>
                                <dd>{o.user?.city ?? '—'}</dd>
                                <dt className="text-gray-500">آدرس تحویل</dt>
                                <dd>{o.address ?? '—'}</dd>
                                <dt className="text-gray-500">تلفن سفارش</dt>
                                <dd dir="ltr">{o.phone ?? '—'}</dd>
                                <dt className="text-gray-500">یادداشت</dt>
                                <dd>{o.note ?? '—'}</dd>
                                <dt className="text-gray-500">پرداخت</dt>
                                <dd>
                                  {o.paymentMethod ?? '—'}
                                  {o.paymentRefNumber ? ` · ref ${o.paymentRefNumber}` : ''}
                                </dd>
                                <dt className="text-gray-500">زمان پرداخت</dt>
                                <dd>
                                  {o.paidAt ? new Date(o.paidAt).toLocaleString('fa-IR') : '—'}
                                </dd>
                                <dt className="text-gray-500">آخرین تغییر وضعیت</dt>
                                <dd>
                                  {o.statusChangedAt
                                    ? new Date(o.statusChangedAt).toLocaleString('fa-IR')
                                    : '—'}
                                </dd>
                              </dl>
                            </div>

                            <div className="space-y-2 rounded-lg border bg-white p-4">
                              <h3 className="font-semibold">اقلام سفارش</h3>
                              <ul className="space-y-3">
                                {(o.items ?? []).map((item) => {
                                  const img = parseImages(
                                    typeof item.product?.images === 'string'
                                      ? item.product.images
                                      : undefined,
                                  )[0];
                                  return (
                                    <li
                                      key={item.id}
                                      className="flex gap-3 border-b border-dashed pb-3 last:border-0 last:pb-0"
                                    >
                                      {img ? (
                                        <Image
                                          src={img}
                                          alt=""
                                          width={80}
                                          height={80}
                                          className="size-14 rounded object-cover"
                                        />
                                      ) : (
                                        <div className="bg-muted size-14 rounded" />
                                      )}
                                      <div className="min-w-0 flex-1">
                                        <p className="font-medium">
                                          {item.product?.title ?? 'محصول'}
                                          {item.color
                                            ? ` · ${getProductColorLabel(item.color)}`
                                            : ''}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          {item.product?.category?.name ?? '—'} ·{' '}
                                          {item.product?.advertiser === 'SHOP'
                                            ? 'فروشگاه'
                                            : (item.product?.user?.name ?? 'فروشنده')}
                                        </p>
                                        <p className="text-primary mt-1 text-sm">
                                          {item.quantity.toLocaleString('fa-IR')} ×{' '}
                                          {formatPrice(item.price)} ={' '}
                                          {formatPrice(item.quantity * item.price)} تومان
                                        </p>
                                      </div>
                                    </li>
                                  );
                                })}
                              </ul>
                              <p className="text-primary border-t pt-2 text-sm font-bold">
                                جمع کل: {formatPrice(o.total)} تومان
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
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
