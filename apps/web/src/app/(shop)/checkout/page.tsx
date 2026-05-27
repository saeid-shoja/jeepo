'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatPrice } from '@offroad/shared';
import { CreditCard, Loader2, Truck } from 'lucide-react';

import { CartLineItem } from '@/components/cart/cart-line-item';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormError } from '@/components/form/form-message';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/stores/auth-store';
import { api } from '@/lib/api';
import { useCart } from '@/stores/cart-store';
import { cn } from '@/lib/utils';

type PaymentMethod = 'ONLINE' | 'COD';

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; desc: string; icon: typeof CreditCard }[] = [
  {
    value: 'ONLINE',
    label: 'پرداخت آنلاین',
    desc: 'پرداخت امن از درگاه بانکی (شبیه‌سازی)',
    icon: CreditCard,
  },
  {
    value: 'COD',
    label: 'پرداخت در محل',
    desc: 'پرداخت هنگام تحویل کالا',
    icon: Truck,
  },
];

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const { items, subtotal, itemCount, clearCart } = useCart();
  const router = useRouter();

  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('ONLINE');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [previewTotal, setPreviewTotal] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?next=${encodeURIComponent('/checkout')}`);
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.phone) setPhone(user.phone);
  }, [user]);

  useEffect(() => {
    if (items.length === 0) {
      router.replace('/cart');
      return;
    }
    api.orders
      .preview({
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      })
      .then((res) => setPreviewTotal(res.total))
      .catch(() => setPreviewTotal(subtotal));
  }, [items, router, subtotal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const order = await api.orders.create({
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        address,
        phone: phone || undefined,
        note: note || undefined,
        paymentMethod,
      });
      clearCart();
      router.push(`/checkout/success?orderId=${order.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'ثبت سفارش ناموفق بود');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !user || items.length === 0) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="text-muted-foreground size-8 animate-spin" />
      </div>
    );
  }

  const total = previewTotal ?? subtotal;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">تسویه حساب</h1>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <FormError message={error} />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">اطلاعات تحویل</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">آدرس کامل تحویل</Label>
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  required
                  placeholder="استان، شهر، خیابان، پلاک، واحد..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">شماره تماس</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0912xxxxxxx"
                  dir="ltr"
                  className="text-end"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="note">توضیحات سفارش (اختیاری)</Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="زمان تحویل، نکات اضافه..."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">روش پرداخت</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {PAYMENT_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const selected = paymentMethod === opt.value;
                return (
                  <Button
                    key={opt.value}
                    type="button"
                    variant={selected ? 'default' : 'outline'}
                    className={cn(
                      'h-auto flex-col items-start gap-2 p-4 text-start',
                      selected && 'ring-2 ring-ring',
                    )}
                    onClick={() => setPaymentMethod(opt.value)}
                  >
                    <Icon className="size-5" />
                    <span className="text-sm font-medium">{opt.label}</span>
                    <span className="text-muted-foreground text-xs font-normal">{opt.desc}</span>
                  </Button>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">مرور سفارش</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {items.map((item) => (
                <CartLineItem key={item.productId} item={item} />
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="text-base">پرداخت</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">تعداد</span>
                <span>{itemCount} عدد</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">جمع</span>
                <span>{formatPrice(total)} تومان</span>
              </div>
              <div className="border-t pt-3 flex justify-between font-bold">
                <span>مبلغ نهایی</span>
                <span className="text-primary text-lg">{formatPrice(total)} تومان</span>
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    در حال ثبت...
                  </>
                ) : paymentMethod === 'ONLINE' ? (
                  'پرداخت و ثبت سفارش'
                ) : (
                  'ثبت سفارش'
                )}
              </Button>

              <Button type="button" variant="outline" className="w-full" asChild>
                <Link href="/cart">بازگشت به سبد</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
