'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { formatPrice } from '@offroad/shared';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { CartLineItem } from '@/components/cart/cart-line-item';
import { FieldError } from '@/components/form/field-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import { type CheckoutFormValues, checkoutSchema } from '@/lib/validations/checkout';
import { useAuth } from '@/stores/auth-store';
import { useCart } from '@/stores/cart-store';

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const { items, subtotal, itemCount, clearCart } = useCart();
  const router = useRouter();
  const [previewTotal, setPreviewTotal] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      address: '',
      phone: '',
      note: '',
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?next=${encodeURIComponent('/checkout')}`);
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.phone) setValue('phone', user.phone);
  }, [user, setValue]);

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

  const onSubmit = async (data: CheckoutFormValues) => {
    try {
      const order = await api.orders.create({
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        address: data.address,
        phone: data.phone || undefined,
        note: data.note || undefined,
        paymentMethod: 'ONLINE',
      });
      clearCart();
      toast.success('سفارش با موفقیت ثبت شد');
      router.push(`/checkout/success?orderId=${order.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'ثبت سفارش ناموفق بود');
    }
  };

  if (authLoading || !user || items.length === 0) {
    return (
      <div className="flex justify-center px-4 py-20">
        <Loader2 className="text-muted-foreground size-8 animate-spin" />
      </div>
    );
  }

  const total = previewTotal ?? subtotal;

  return (
    <div className="container space-y-6 px-4 py-6 sm:py-8">
      <h1 className="text-2xl font-bold">تسویه حساب</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-3" noValidate>
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">اطلاعات تحویل</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">آدرس کامل تحویل</Label>
                <Textarea
                  id="address"
                  rows={3}
                  placeholder="استان، شهر، خیابان، پلاک، واحد..."
                  {...register('address')}
                />
                <FieldError message={errors.address?.message} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">شماره تماس</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0912xxxxxxx"
                  dir="ltr"
                  className="text-end"
                  {...register('phone')}
                />
                <FieldError message={errors.phone?.message} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="note">توضیحات سفارش (اختیاری)</Label>
                <Textarea
                  id="note"
                  rows={2}
                  placeholder="زمان تحویل، نکات اضافه..."
                  {...register('note')}
                />
              </div>
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
          <Card className="lg:sticky lg:top-24">
            <CardHeader>
              <CardTitle className="text-base">پرداخت</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">روش پرداخت</span>
                <span>پرداخت آنلاین</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">تعداد</span>
                <span>{itemCount} عدد</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">جمع</span>
                <span>{formatPrice(total)} تومان</span>
              </div>
              <div className="flex justify-between border-t pt-3 font-bold">
                <span>مبلغ نهایی</span>
                <span className="text-primary text-lg">{formatPrice(total)} تومان</span>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    در حال ثبت...
                  </>
                ) : (
                  'پرداخت و ثبت سفارش'
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
