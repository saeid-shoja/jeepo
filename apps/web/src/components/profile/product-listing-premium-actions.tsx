'use client';

import {
  BOOST_LISTING_FEE,
  isStrengthenedActive,
  PAYMENT_PURPOSES,
  type PaymentPurpose,
  STRENGTHENED_DURATION_DAYS,
  STRENGTHENED_LISTING_FEE,
} from '@offroad/shared';
import { Sparkles, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ListingPremiumPaymentDialog } from '@/components/form/premium-listing-payment-dialog';
import { Button } from '@/components/ui/button';
import { buildPaymentPageUrl } from '@/lib/payment-url';

type ProductListingPremiumActionsProps = {
  product: {
    id: string;
    status: string;
    isAuction?: boolean;
    isBoosted?: boolean;
    strengthenedUntil?: string | null;
  };
  onUpdated: () => void | Promise<void>;
};

export function ProductListingPremiumActions({ product }: ProductListingPremiumActionsProps) {
  const router = useRouter();
  const [paymentKind, setPaymentKind] = useState<'strengthened' | 'boost' | null>(null);

  const strengthenedActive = isStrengthenedActive(product.strengthenedUntil);
  const canUsePremium = product.status === 'ACTIVE' && !product.isAuction;

  if (!canUsePremium) return null;

  const goToPayment = (purpose: PaymentPurpose) => {
    setPaymentKind(null);
    router.push(buildPaymentPageUrl(product.id, purpose));
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-2 px-1 sm:grid-cols-2">
        <Button
          type="button"
          size="sm"
          variant={strengthenedActive ? 'secondary' : 'outline'}
          className="w-full gap-1 text-xs"
          onClick={() => setPaymentKind('strengthened')}
        >
          <Sparkles className="size-3.5" />
          {strengthenedActive ? 'تمدید تقویت' : 'تقویت شده'}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="w-full gap-1 text-xs"
          onClick={() => setPaymentKind('boost')}
        >
          <TrendingUp className="size-3.5" />
          پله شده
        </Button>
      </div>

      <ListingPremiumPaymentDialog
        open={paymentKind === 'strengthened'}
        onOpenChange={(open) => !open && setPaymentKind(null)}
        loading={false}
        title="پرداخت هزینه تقویت آگهی"
        description={`آگهی شما به مدت ${STRENGTHENED_DURATION_DAYS} روز در بالای لیست‌ها می‌ماند (بدون توجه به زمان ثبت).`}
        fee={STRENGTHENED_LISTING_FEE}
        onConfirm={() => goToPayment(PAYMENT_PURPOSES.LISTING_STRENGTHENED)}
      />

      <ListingPremiumPaymentDialog
        open={paymentKind === 'boost'}
        onOpenChange={(open) => !open && setPaymentKind(null)}
        loading={false}
        title="پرداخت هزینه پله‌شدن"
        description="آگهی یک‌بار به بالای لیست منتقل می‌شود و زمان انتشار (listedAt) به‌روز می‌شود."
        fee={BOOST_LISTING_FEE}
        onConfirm={() => goToPayment(PAYMENT_PURPOSES.LISTING_BOOST)}
      />
    </>
  );
}
