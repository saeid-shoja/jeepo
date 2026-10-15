'use client';

import { formatPrice, getOrderStatusLabel, getProductColorLabel } from '@offroad/shared';
import { Package } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  GuaranteedBuyerOrderItems,
  GuaranteedSellerOrders,
} from '@/components/orders/guaranteed-order-workflow';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useAuth } from '@/stores/auth-store';

const PAYMENT_LABELS: Record<string, string> = {
  ONLINE: 'آنلاین',
};

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sellerOrders, setSellerOrders] = useState<any[]>([]);
  const [view, setView] = useState<'purchases' | 'sales'>('purchases');

  const refreshOrders = () => {
    void Promise.all([api.orders.my(), api.orders.selling()])
      .then(([purchases, sales]) => {
        setOrders(purchases);
        setSellerOrders(sales);
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?next=/orders');
      return;
    }
    if (user) {
      void Promise.all([api.orders.my(), api.orders.selling()])
        .then(([purchases, sales]) => {
          setOrders(purchases);
          setSellerOrders(sales);
        })
        .catch(() => {
          setOrders([]);
          setSellerOrders([]);
        })
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

      <div className="flex gap-2 border-b">
        <button
          type="button"
          onClick={() => setView('purchases')}
          className={`border-b-2 px-3 py-2 text-sm ${view === 'purchases' ? 'border-primary font-semibold' : 'border-transparent text-muted-foreground'}`}
        >
          خریدهای من
        </button>
        <button
          type="button"
          onClick={() => setView('sales')}
          className={`border-b-2 px-3 py-2 text-sm ${view === 'sales' ? 'border-primary font-semibold' : 'border-transparent text-muted-foreground'}`}
        >
          فروش‌های تضمینی
        </button>
      </div>

      {view === 'sales' ? (
        <GuaranteedSellerOrders orders={sellerOrders} onChanged={refreshOrders} />
      ) : null}

      {view === 'purchases' && orders.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <Package className="text-muted-foreground mx-auto size-12 opacity-40" />
          <p className="mt-4 text-gray-500">هنوز سفارشی ثبت نکرده‌اید</p>
          <Link href="/" className="text-primary mt-2 inline-block text-sm hover:underline">
            رفتن به فروشگاه
          </Link>
        </div>
      ) : null}
      {view === 'purchases' && orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-2">
                <CardTitle className="text-sm font-medium">
                  شماره سفارش: {order.id.slice(-8)}
                </CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{getOrderStatusLabel(order.status)}</Badge>
                  {order.paymentMethod && (
                    <Badge variant="outline">
                      نحوه پرداخت: {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-primary font-bold">
                  قیمت محصول:‌{formatPrice(order.total)} تومان
                </p>
                <p className="text-primary font-bold">
                  تاریخ سفارش:‌{new Date(order.createdAt).toLocaleDateString('fa-IR')}
                </p>
                {order.address && <p className="text-muted-foreground">آدرس: {order.address}</p>}
                <ul className="space-y-2 border-t pt-3">
                  {order.items?.map((item: any) => (
                    <li key={item.id} className="flex justify-between gap-2">
                      <Link
                        href={`/product/${item.productId}`}
                        className="line-clamp-1 hover:text-primary"
                      >
                        محصول: {item.product?.title}
                        {item.color ? ` · ${getProductColorLabel(item.color)}` : ''}
                      </Link>
                      <span className="shrink-0 text-muted-foreground">
                        قیمت کل: {formatPrice(item.price * item.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>
                <GuaranteedBuyerOrderItems orders={[order]} onChanged={refreshOrders} />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
