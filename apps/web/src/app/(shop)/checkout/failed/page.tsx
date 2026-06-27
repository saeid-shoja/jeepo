'use client';

import { XCircle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import { Button } from '@/components/ui/button';

const REASON_MESSAGES: Record<string, string> = {
  payment_cancelled: 'پرداخت توسط شما لغو شد.',
  verify_failed: 'تأیید پرداخت در درگاه ناموفق بود.',
  amount_mismatch: 'مبلغ پرداخت با سفارش مطابقت ندارد.',
  track_mismatch: 'اطلاعات پرداخت با سفارش همخوانی ندارد.',
  order_not_found: 'سفارش یافت نشد.',
  invalid_callback: 'پاسخ درگاه پرداخت نامعتبر است.',
};

function FailedContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const reason = searchParams.get('reason');
  const message =
    (reason && REASON_MESSAGES[reason]) ||
    'پرداخت انجام نشد. در صورت کسر وجه، با پشتیبانی تماس بگیرید.';

  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <XCircle className="mx-auto size-16 text-destructive" />
      <h1 className="mt-4 text-2xl font-bold">پرداخت ناموفق</h1>
      <p className="text-muted-foreground mt-2 text-sm">{message}</p>
      {orderId && (
        <p className="text-muted-foreground mt-1 text-xs">شناسه سفارش: {orderId.slice(-8)}</p>
      )}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild>
          <Link href="/checkout">تلاش مجدد</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">بازگشت به فروشگاه</Link>
        </Button>
      </div>
    </div>
  );
}

export default function CheckoutFailedPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center">در حال بارگذاری...</div>}>
      <FailedContent />
    </Suspense>
  );
}
