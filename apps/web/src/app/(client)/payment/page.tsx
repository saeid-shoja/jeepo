'use client';

import {
  formatPrice,
  isPaymentPurpose,
  PAYMENT_GATEWAYS,
  type PaymentGateway,
} from '@offroad/shared';
import { CreditCard, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useAuth } from '@/stores/auth-store';

type PrepareResponse = Awaited<ReturnType<typeof api.payments.prepare>>;

const FUTURE_GATEWAYS: { id: string; label: string }[] = [
  { id: 'SAMAN', label: 'سامان' },
  { id: 'MELLAT', label: 'ملت' },
];

function PaymentPageContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get('productId') ?? '';
  const purposeParam = searchParams.get('purpose') ?? '';
  const nextPurposeParam = searchParams.get('nextPurpose');

  const purpose = isPaymentPurpose(purposeParam) ? purposeParam : null;
  const nextPurpose =
    nextPurposeParam && isPaymentPurpose(nextPurposeParam) ? nextPurposeParam : undefined;

  const [data, setData] = useState<PrepareResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [gateway, setGateway] = useState<PaymentGateway>(PAYMENT_GATEWAYS.ZIBAL);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(
        `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`,
      );
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || !productId || !purpose) {
      if (!authLoading) setLoading(false);
      return;
    }

    setLoading(true);
    api.payments
      .prepare({ productId, purpose, nextPurpose })
      .then(setData)
      .catch((err: unknown) => {
        toast.error(err instanceof Error ? err.message : 'بارگذاری اطلاعات پرداخت ناموفق بود');
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [user, productId, purpose, nextPurpose, authLoading]);

  const handlePay = async () => {
    if (!productId || !purpose) return;
    setPaying(true);
    try {
      const result = await api.payments.initiate({
        productId,
        purpose,
        gateway,
        nextPurpose,
      });
      window.location.assign(result.paymentUrl);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'اتصال به درگاه پرداخت ناموفق بود');
      setPaying(false);
    }
  };

  if (authLoading || loading) {
    return <div className="py-16 text-center text-muted-foreground">در حال بارگذاری...</div>;
  }

  if (!productId || !purpose) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="text-muted-foreground">اطلاعات پرداخت نامعتبر است.</p>
        <Button asChild className="mt-6">
          <Link href="/dashboard">بازگشت به پروفایل</Link>
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="text-muted-foreground">امکان نمایش صفحه پرداخت وجود ندارد.</p>
        <Button asChild className="mt-6">
          <Link href="/dashboard">بازگشت به پروفایل</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-bold">پرداخت</h1>
        <p className="text-muted-foreground mt-1 text-sm">{data.purposeLabel}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">جزئیات آگهی</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          {data.product.image ? (
            <div className="bg-muted size-20 shrink-0 overflow-hidden rounded-lg">
              <Image
                src={data.product.image}
                alt=""
                width={80}
                height={80}
                className="size-full object-cover"
              />
            </div>
          ) : (
            <div className="bg-muted size-20 shrink-0 rounded-lg" />
          )}
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 font-medium">{data.product.title}</p>
            <p className="text-muted-foreground mt-1 text-sm">
              قیمت آگهی: {formatPrice(data.product.price)} تومان
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">مبلغ قابل پرداخت</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-primary text-3xl font-bold">
            {formatPrice(data.amount)} <span className="text-base font-normal">تومان</span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">روش پرداخت</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.gateways.map((item) => {
            const selected = gateway === item.id;
            return (
              <button
                key={item.id}
                type="button"
                disabled={!item.enabled || paying}
                onClick={() => setGateway(item.id as PaymentGateway)}
                className={`flex w-full items-center gap-3 rounded-lg border p-4 text-start transition-colors ${
                  selected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                } ${!item.enabled ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                <CreditCard className="text-muted-foreground size-5 shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">{item.label}</p>
                  <p className="text-muted-foreground text-xs">پرداخت امن آنلاین</p>
                </div>
                {selected ? (
                  <span className="bg-primary size-2.5 shrink-0 rounded-full" />
                ) : (
                  <span className="border-input size-2.5 shrink-0 rounded-full border" />
                )}
              </button>
            );
          })}
          {FUTURE_GATEWAYS.map((item) => (
            <div key={item.id} className="flex items-center gap-3 rounded-lg border p-4 opacity-50">
              <CreditCard className="text-muted-foreground size-5 shrink-0" />
              <div className="flex-1">
                <p className="font-medium">{item.label}</p>
                <p className="text-muted-foreground text-xs">به زودی</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        <Button type="button" size="lg" disabled={paying} onClick={() => void handlePay()}>
          {paying ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              در حال انتقال به درگاه...
            </>
          ) : (
            `پرداخت ${formatPrice(data.amount)} تومان`
          )}
        </Button>
        <Button type="button" variant="outline" asChild disabled={paying}>
          <Link href="/dashboard">انصراف</Link>
        </Button>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center">در حال بارگذاری...</div>}>
      <PaymentPageContent />
    </Suspense>
  );
}
