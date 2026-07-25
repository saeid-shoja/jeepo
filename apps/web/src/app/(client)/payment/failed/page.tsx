'use client';

import { getPaymentPurposeLabel, isPaymentPurpose } from '@offroad/shared';
import { XCircle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { buildPaymentPageUrl } from '@/lib/payment-url';

const REASON_LABELS: Record<string, string> = {
  payment_cancelled: 'پرداخت توسط شما لغو شد.',
  verify_failed: 'تأیید پرداخت از سمت درگاه ناموفق بود.',
  amount_mismatch: 'مبلغ پرداخت با سفارش مطابقت ندارد.',
  track_mismatch: 'شناسه تراکنش نامعتبر است.',
  fulfillment_failed: 'پرداخت انجام شد اما ثبت نهایی با خطا مواجه شد. با پشتیبانی تماس بگیرید.',
  server_error: 'خطای سرور. لطفاً دوباره تلاش کنید.',
};

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason') ?? '';
  const productId = searchParams.get('productId');
  const purposeParam = searchParams.get('purpose');
  const purpose = purposeParam && isPaymentPurpose(purposeParam) ? purposeParam : null;

  const purposeLabel = purpose ? getPaymentPurposeLabel(purpose) : 'پرداخت';

  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <XCircle className="mx-auto size-16 text-destructive" />
      <h1 className="mt-4 text-2xl font-bold">پرداخت ناموفق</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        {REASON_LABELS[reason] ?? `${purposeLabel} انجام نشد.`}
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        {productId && purpose ? (
          <Button asChild>
            <Link href={buildPaymentPageUrl(productId, purpose)}>تلاش مجدد</Link>
          </Button>
        ) : null}
        <Button variant="outline" asChild>
          <Link href="/dashboard">بازگشت به پروفایل</Link>
        </Button>
      </div>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center">در حال بارگذاری...</div>}>
      <PaymentFailedContent />
    </Suspense>
  );
}
