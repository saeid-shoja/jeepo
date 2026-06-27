'use client';

import { formatPrice } from '@offroad/shared';
import { Package } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useAuth } from '@/stores/auth-store';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'در انتظار',
  CONFIRMED: 'تأیید شده',
  SHIPPED: 'ارسال شده',
  DELIVERED: 'تحویل شده',
  CANCELLED: 'لغو شده',
};

const PAYMENT_LABELS: Record<string, string> = {
  ONLINE: 'آنلاین',
};

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?next=/orders');
      return;
    }
    if (user) {
      api.orders
        .my()
        .then(setOrders)
        .catch(() => setOrders([]))
        .finally(() => setLoading(false));
    }
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return <div className="py-16 text-center text-gray-500">در حال بارگذاری...</div>;
  }

  if (!user) return null;

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
                  <Badge variant="secondary">{STATUS_LABELS[order.status] ?? order.status}</Badge>
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
                      <Link
                        href={`/product/${item.productId}`}
                        className="line-clamp-1 hover:text-primary"
                      >
                        {item.product?.title ?? 'محصول'}
                      </Link>
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
