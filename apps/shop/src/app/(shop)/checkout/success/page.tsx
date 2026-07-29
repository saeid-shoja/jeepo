'use client';

import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import { Button } from '@/components/ui/button';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <CheckCircle2 className="mx-auto size-16 text-green-600" />
      <h1 className="mt-4 text-2xl font-bold">پرداخت با موفقیت انجام شد</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        {orderId
          ? `سفارش ${orderId.slice(-8)} ثبت و پرداخت شد.`
          : 'به زودی با شما تماس گرفته می‌شود.'}
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild>
          <Link href="/orders">مشاهده سفارش‌ها</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">ادامه خرید</Link>
        </Button>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center">در حال بارگذاری...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
