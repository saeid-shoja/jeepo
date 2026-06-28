'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { formatPrice } from '@offroad/shared';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

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

type OrderPreviewItem = {
  productId: string;
  title: string;
  image: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

type OrderPreview = {
  items: OrderPreviewItem[];
  total: number;
  itemCount: number;
};

function CheckoutLineItem({ item }: { item: OrderPreviewItem }) {
  return (
    <div className="flex gap-4 border-b py-4 last:border-0">
      <Link
        href={`/product/${item.productId}`}
        className="bg-muted size-20 shrink-0 overflow-hidden rounded-lg"
      >
        {item.image ? (
          <Image
            width={300}
            height={400}
            src={item.image}
            alt=""
            className="size-full object-cover"
          />
        ) : (
          <div className="text-muted-foreground flex size-full items-center justify-center text-xs">
            بدون تصویر
          </div>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
        <Link
          href={`/product/${item.productId}`}
          className="line-clamp-2 text-sm font-medium hover:text-primary"
        >
          {item.title}
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-muted-foreground text-sm">{item.quantity} عدد</span>
          <div className="text-end">
            <p className="text-primary text-sm font-bold">
              {formatPrice(item.lineTotal)}{' '}
              <span className="text-muted-foreground text-xs font-normal">تومان</span>
            </p>
            <p className="text-muted-foreground text-xs">واحد: {formatPrice(item.unitPrice)} تومان</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const { items, itemCount, clearCart } = useCart();
  const router = useRouter();
  const [preview, setPreview] = useState<OrderPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [redirectingToGateway, setRedirectingToGateway] = useState(false);

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

    let cancelled = false;
    setPreviewLoading(true);
    setPreviewError(null);

    api.orders
      .preview({
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      })
      .then((res) => {
        if (cancelled) return;
        setPreview(res);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setPreview(null);
        setPreviewError(err instanceof Error ? err.message : 'بارگذاری قیمت‌ها ناموفق بود');
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [items, router]);

  const onSubmit = async (data: CheckoutFormValues) => {
    try {
      const { id, paymentUrl } = await api.orders.create({
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        address: data.address,
        phone: data.phone || undefined,
        note: data.note || undefined,
        paymentMethod: 'ONLINE',
      });
      clearCart();
      if (paymentUrl) {
        setRedirectingToGateway(true);
        window.location.assign(paymentUrl);
        return;
      }
      toast.success('سفارش با موفقیت ثبت شد');
      router.push(`/checkout/success?orderId=${id}`);
    } catch (err: unknown) {
      setRedirectingToGateway(false);
      toast.error(err instanceof Error ? err.message : 'ثبت سفارش ناموفق بود');
    }
  };

  if (redirectingToGateway) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 px-4">
        <Loader2 className="text-primary size-12 animate-spin" />
        <p className="mt-6 text-lg font-semibold">در حال انتقال به درگاه پرداخت</p>
        <p className="text-muted-foreground mt-2 text-center text-sm">
          لطفاً صبر کنید. به زودی به درگاه پرداخت منتقل می‌شوید.
        </p>
      </div>
    );
  }

  if (authLoading || !user || items.length === 0) {
    return (
      <div className="flex justify-center px-4 py-20">
        <Loader2 className="text-muted-foreground size-8 animate-spin" />
      </div>
    );
  }

  const total = preview?.total ?? 0;
  const displayItemCount = preview?.itemCount ?? itemCount;
  const canSubmit = Boolean(preview) && !previewLoading && !previewError;

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
              {previewLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="text-muted-foreground size-6 animate-spin" />
                </div>
              ) : previewError ? (
                <p className="text-destructive py-4 text-sm">{previewError}</p>
              ) : (
                preview?.items.map((item) => <CheckoutLineItem key={item.productId} item={item} />)
              )}
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
                <span>{displayItemCount} عدد</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">جمع</span>
                <span>
                  {previewLoading ? '...' : previewError ? '—' : `${formatPrice(total)} تومان`}
                </span>
              </div>
              <div className="flex justify-between border-t pt-3 font-bold">
                <span>مبلغ نهایی</span>
                <span className="text-primary text-lg">
                  {previewLoading ? '...' : previewError ? '—' : `${formatPrice(total)} تومان`}
                </span>
              </div>

              {previewError ? (
                <p className="text-muted-foreground text-xs">
                  قیمت‌ها از سرور بارگذاری نشد. لطفاً صفحه را رفرش کنید یا به سبد بازگردید.
                </p>
              ) : null}

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || redirectingToGateway || !canSubmit}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    در حال ثبت سفارش...
                  </>
                ) : (
                  'انتقال به درگاه پرداخت'
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
