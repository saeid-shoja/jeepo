'use client';

import { formatPrice } from '@offroad/shared';
import { CheckCircle2, RefreshCw, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { adminApi } from '@/lib/api';

type GuaranteedItem = {
  id: string;
  quantity: number;
  price: number;
  guaranteeStatus: string | null;
  packagingVideo?: string | null;
  packagingImages?: string[];
  shippingReceipt?: string | null;
  shippedAt?: string | null;
  product?: {
    id: string;
    title: string;
    userId?: string | null;
    user?: { id?: string; name?: string; phone?: string | null; email: string | null } | null;
  } | null;
};

type GuaranteedOrder = {
  id: string;
  createdAt: string;
  total: number;
  paidAt?: string | null;
  user?: { id: string; name: string; phone?: string | null; email?: string | null } | null;
  items?: GuaranteedItem[];
};

type Filter = 'action' | 'processing' | 'cancelled' | 'closed' | 'all';
type AdminAction = 'PAY_SELLER' | 'APPROVE_CANCEL' | 'MARK_REFUNDED' | 'UNDER_REVIEW';

const STATUS_LABELS: Record<string, string> = {
  WAITING_SELLER_CONFIRMATION: 'در انتظار تأیید فروشنده',
  PACKAGING: 'در حال بسته‌بندی',
  READY_TO_SHIP: 'آماده ارسال',
  SHIPPED: 'ارسال شده',
  BUYER_CONFIRMED: 'تأیید دریافت خریدار',
  BUYER_CANCELLED: 'لغو توسط خریدار',
  REFUND_PENDING: 'در انتظار اقدام برای لغو',
  UNDER_REVIEW: 'در حال بررسی',
  CANCELLED: 'لغو تأیید شد · بازپرداخت در انتظار انجام',
  REFUNDED: 'بازپرداخت انجام شد',
  PAID_TO_SELLER: 'وجه به فروشنده پرداخت شد',
};

const CANCELLED_STATUSES = new Set(['BUYER_CANCELLED', 'REFUND_PENDING', 'CANCELLED', 'REFUNDED']);
const ACTION_STATUSES = new Set([
  'BUYER_CONFIRMED',
  'BUYER_CANCELLED',
  'REFUND_PENDING',
  'UNDER_REVIEW',
  'CANCELLED',
]);
const CLOSED_STATUSES = new Set(['PAID_TO_SELLER']);

function ActionButton({
  disabled,
  onClick,
  children,
  tone,
}: {
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
  tone: 'green' | 'red' | 'neutral';
}) {
  const styles = {
    green: 'bg-green-700 text-white hover:bg-green-800',
    red: 'bg-red-700 text-white hover:bg-red-800',
    neutral: 'border bg-white hover:bg-gray-50',
  };
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded px-3 py-2 text-xs font-medium disabled:opacity-50 ${styles[tone]}`}
    >
      {children}
    </button>
  );
}

export default function GuaranteedOrdersPage() {
  const [orders, setOrders] = useState<GuaranteedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('action');
  const [busyItemId, setBusyItemId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminApi.guaranteedOrders();
      setOrders(Array.isArray(result) ? result : []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'بارگذاری سفارش‌های تضمینی ناموفق بود');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  const items = useMemo(
    () =>
      orders.flatMap((order) =>
        (order.items ?? []).filter((item) => item.guaranteeStatus).map((item) => ({ order, item })),
      ),
    [orders],
  );

  const filtered = useMemo(
    () =>
      items.filter(({ item }) => {
        const status = item.guaranteeStatus ?? '';
        if (filter === 'all') return true;
        if (filter === 'action') return ACTION_STATUSES.has(status);
        if (filter === 'cancelled') return CANCELLED_STATUSES.has(status);
        if (filter === 'closed') return CLOSED_STATUSES.has(status);
        return (
          !ACTION_STATUSES.has(status) &&
          !CANCELLED_STATUSES.has(status) &&
          !CLOSED_STATUSES.has(status)
        );
      }),
    [filter, items],
  );

  const resolveItem = async (
    orderId: string,
    itemId: string,
    action: AdminAction,
    confirmText: string,
  ) => {
    if (!window.confirm(confirmText)) return;
    setBusyItemId(itemId);
    try {
      await adminApi.resolveGuaranteedOrderItem(orderId, itemId, action);
      toast.success('وضعیت سفارش تضمینی به‌روزرسانی شد');
      await fetchOrders();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'تغییر وضعیت ناموفق بود');
    } finally {
      setBusyItemId(null);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ShieldCheck className="size-6 text-primary" />
          <h1 className="text-2xl font-bold">سفارش‌های تضمینی</h1>
        </div>
        <button
          type="button"
          onClick={() => void fetchOrders()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className="size-4" />
          بروزرسانی
        </button>
      </header>

      <div className="flex flex-wrap gap-2 border-b">
        {(
          [
            ['action', 'نیازمند اقدام'],
            ['processing', 'در جریان'],
            ['cancelled', 'لغوشده'],
            ['closed', 'بسته‌شده'],
            ['all', 'همه'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`border-b-2 px-3 py-2 text-sm ${filter === value ? 'border-primary font-semibold text-primary' : 'border-transparent text-gray-500'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-gray-500">در حال بارگذاری…</p>
      ) : filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-500">سفارشی در این بخش وجود ندارد.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map(({ order, item }) => {
            const status = item.guaranteeStatus ?? '';
            const busy = busyItemId === item.id;
            return (
              <article key={item.id} className="space-y-3 rounded border bg-white p-4">
                <header className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">{item.product?.title ?? 'محصول تضمینی'}</h2>
                    <p className="mt-1 text-xs text-gray-500">
                      سفارش {order.id.slice(-8)} ·{' '}
                      {new Date(order.createdAt).toLocaleString('fa-IR')}
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900">
                    {STATUS_LABELS[status] ?? status}
                  </span>
                </header>

                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <div className="space-y-1">
                    <p>خریدار: {order.user?.name ?? '—'}</p>
                    <p className="text-xs text-gray-500">شناسه: {order.user?.id ?? '—'}</p>
                    <p className="text-xs text-gray-500">
                      {order.user?.phone ?? '—'} · {order.user?.email ?? '—'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p>فروشنده: {item.product?.user?.name ?? '—'}</p>
                    <p className="text-xs text-gray-500">شناسه: {item.product?.userId ?? '—'}</p>
                    <p className="text-xs text-gray-500">
                      {item.product?.user?.phone ?? '—'} · {item.product?.user?.email ?? '—'}
                    </p>
                    <p>مبلغ این قلم: {formatPrice(item.price * item.quantity)} تومان</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 border-t pt-3 text-sm">
                  {item.packagingVideo ? (
                    <a
                      href={item.packagingVideo}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline"
                    >
                      مشاهده ویدیوی بسته‌بندی
                    </a>
                  ) : null}
                  {item.shippingReceipt ? (
                    <a
                      href={item.shippingReceipt}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline"
                    >
                      مشاهده بارنامه / رسید ارسال
                    </a>
                  ) : null}
                  {item.packagingImages?.map((image) => (
                    <a key={image} href={image} target="_blank" rel="noreferrer">
                      <Image
                        src={image}
                        alt="مدرک بسته‌بندی"
                        width={72}
                        height={72}
                        unoptimized
                        className="size-16 rounded border object-cover"
                      />
                    </a>
                  ))}
                </div>

                {ACTION_STATUSES.has(status) ? (
                  <div className="flex flex-wrap gap-2 border-t pt-3">
                    {status === 'BUYER_CONFIRMED' || status === 'UNDER_REVIEW' ? (
                      <ActionButton
                        disabled={busy}
                        tone="green"
                        onClick={() =>
                          void resolveItem(
                            order.id,
                            item.id,
                            'PAY_SELLER',
                            'پرداخت به فروشنده تأیید شود؟',
                          )
                        }
                      >
                        <CheckCircle2 className="mr-1 inline size-3.5" /> تأیید واریز به فروشنده
                      </ActionButton>
                    ) : null}
                    {status === 'REFUND_PENDING' || status === 'UNDER_REVIEW' ? (
                      <ActionButton
                        disabled={busy}
                        tone="red"
                        onClick={() =>
                          void resolveItem(
                            order.id,
                            item.id,
                            'APPROVE_CANCEL',
                            'لغو سفارش تأیید شود؟ بازپرداخت باید جداگانه انجام شود.',
                          )
                        }
                      >
                        تأیید لغو
                      </ActionButton>
                    ) : null}
                    {status === 'CANCELLED' ? (
                      <ActionButton
                        disabled={busy}
                        tone="green"
                        onClick={() =>
                          void resolveItem(
                            order.id,
                            item.id,
                            'MARK_REFUNDED',
                            'آیا بازپرداخت وجه واقعاً انجام شده است؟',
                          )
                        }
                      >
                        ثبت انجام بازپرداخت
                      </ActionButton>
                    ) : null}
                    {status === 'BUYER_CONFIRMED' || status === 'REFUND_PENDING' ? (
                      <ActionButton
                        disabled={busy}
                        tone="neutral"
                        onClick={() =>
                          void resolveItem(
                            order.id,
                            item.id,
                            'UNDER_REVIEW',
                            'این سفارش به وضعیت در حال بررسی برود؟',
                          )
                        }
                      >
                        در حال بررسی
                      </ActionButton>
                    ) : null}
                  </div>
                ) : status === 'PAID_TO_SELLER' || status === 'REFUNDED' ? (
                  <p className="flex items-center gap-2 border-t pt-3 text-sm text-green-800">
                    <CheckCircle2 className="size-4" /> اقدام مالی نهایی شده است.
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
