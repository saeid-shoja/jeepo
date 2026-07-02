'use client';

import { getPaymentPurposeLabel, isPaymentPurpose, type PaymentPurpose } from '@offroad/shared';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { buildPaymentPageUrl } from '@/lib/payment-url';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const purposeParam = searchParams.get('purpose');
  const productId = searchParams.get('productId');
  const nextPurposeParam = searchParams.get('nextPurpose');
  const requiresAdminApproval = searchParams.get('requiresAdminApproval') === '1';

  const purpose = purposeParam && isPaymentPurpose(purposeParam) ? purposeParam : null;
  const nextPurpose =
    nextPurposeParam && isPaymentPurpose(nextPurposeParam) ? nextPurposeParam : null;

  const purposeLabel = purpose ? getPaymentPurposeLabel(purpose) : 'پرداخت';

  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <CheckCircle2 className="mx-auto size-16 text-green-600" />
      <h1 className="mt-4 text-2xl font-bold">پرداخت موفق</h1>
      <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
        {purposeLabel} با موفقیت انجام شد.
        {requiresAdminApproval
          ? ' آگهی پس از بررسی قیمت توسط مدیر منتشر می‌شود.'
          : purpose === 'LISTING_FEE'
            ? ' آگهی شما منتشر شد.'
            : ''}
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        {productId && nextPurpose ? (
          <Button
            onClick={() =>
              router.push(buildPaymentPageUrl(productId, nextPurpose as PaymentPurpose))
            }
          >
            ادامه پرداخت بعدی
          </Button>
        ) : null}
        <Button asChild variant={productId && nextPurpose ? 'outline' : 'default'}>
          <Link href="/dashboard">مشاهده آگهی‌های من</Link>
        </Button>
        {productId ? (
          <Button variant="outline" asChild>
            <Link href={`/product/${productId}`}>مشاهده آگهی</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center">در حال بارگذاری...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
