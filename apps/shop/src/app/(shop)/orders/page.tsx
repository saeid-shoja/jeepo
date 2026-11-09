'use client';

import { formatPrice, getOrderStatusLabel, getProductColorLabel } from '@offroad/shared';
import { Package } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { AuthPrompt } from '@/components/auth/auth-prompt';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useAuth } from '@/stores/auth-store';

const PAYMENT_LABELS: Record<string, string> = {
  ONLINE: 'آنلاین',
};

const GUARANTEE_STATUS_LABELS: Record<string, string> = {
  WAITING_SELLER_CONFIRMATION: 'در انتظار تأیید فروشنده',
  PACKAGING: 'در حال بسته‌بندی',
  READY_TO_SHIP: 'آماده ارسال',
  SHIPPED: 'ارسال شده',
  BUYER_CONFIRMED: 'دریافت خریدار تأیید شد',
  SUCCESSFUL: 'معامله موفق؛ در انتظار واریز به فروشنده',
  BUYER_CANCELLED: 'در انتظار بررسی لغو',
  REFUND_PENDING: 'در انتظار بررسی لغو',
  UNDER_REVIEW: 'در حال بررسی',
  CANCELLED: 'لغو شده',
  REFUNDED: 'لغو شده؛ بازپرداخت قبلی ثبت شده',
  PAID_TO_SELLER: 'وجه به فروشنده پرداخت شد',
};

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const pathname = usePathname();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    api.orders
      .my()
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading || (user && loading)) {
    return <div className="py-16 text-center text-gray-500">در حال بارگذاری...</div>;
  }

  if (!user) {
    return (
      <div className="container py-8">
        <AuthPrompt
          title="برای مشاهده سفارش‌ها وارد شوید"
          description="پس از ورود، تاریخچه سفارش‌های فروشگاه را می‌بینید."
          nextPath={pathname}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 container">
      <h1 className="text-2xl font-bold">سفارش‌های من</h1>

      {orders.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <Package className="text-muted-foreground mx-auto size-12 opacity-40" />
          <p className="mt-4 text-gray-500">هنوز سفارشی ثبت نکرده‌اید</p>
          <Link href="/" className="text-primary mt-2 inline-block text-sm hover:underline">
            رفتن به فروشگاه
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-2">
                <CardTitle className="text-sm font-medium">سفارش {order.id.slice(-8)}</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    {order.items?.length > 0 &&
                    order.items.every((item: any) =>
                      ['CANCELLED', 'REFUNDED'].includes(item.guaranteeStatus),
                    )
                      ? getOrderStatusLabel('CANCELLED')
                      : getOrderStatusLabel(order.status)}
                  </Badge>
                  {order.paymentMethod && (
                    <Badge variant="outline">
                      {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-primary font-bold">{formatPrice(order.total)} تومان</p>
                {order.address && <p className="text-muted-foreground">آدرس: {order.address}</p>}
                <ul className="space-y-2 border-t pt-3">
                  {order.items?.map((item: any) => (
                    <li key={item.id} className="flex justify-between gap-2">
                      <div className="min-w-0 space-y-1">
                        <Link
                          href={`/product/${item.productId}`}
                          className="line-clamp-1 hover:text-primary"
                        >
                          {item.product?.title ?? 'محصول'}
                          {item.color ? ` · ${getProductColorLabel(item.color)}` : ''}
                        </Link>
                        {item.guaranteeStatus ? (
                          <div className="space-y-1">
                            <Badge variant="outline">
                              {GUARANTEE_STATUS_LABELS[item.guaranteeStatus] ??
                                item.guaranteeStatus}
                            </Badge>
                            {item.guaranteeDeadlineAt &&
                            ['WAITING_SELLER_CONFIRMATION', 'PACKAGING', 'READY_TO_SHIP'].includes(
                              item.guaranteeStatus,
                            ) ? (
                              <p className="text-muted-foreground text-xs">
                                مهلت فروشنده:{' '}
                                {new Date(item.guaranteeDeadlineAt).toLocaleString('fa-IR')}
                              </p>
                            ) : null}
                            {item.guaranteeStatus === 'CANCELLED' &&
                            item.guaranteeCancellationReason ? (
                              <p className="text-xs text-red-800">
                                این معامله به دلیل «{item.guaranteeCancellationReason}» لغو شد
                                {item.guaranteeWalletRefundedAt
                                  ? ` و مبلغ ${formatPrice(item.guaranteeRefundAmount ?? item.price * item.quantity)} تومان به کیف پول جیپو شما بازگشت داده شد.`
                                  : '؛ بازپرداخت به کیف پول شما در انتظار انجام است.'}
                              </p>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                      <span className="shrink-0 text-muted-foreground">
                        {item.quantity} × {formatPrice(item.price)}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
