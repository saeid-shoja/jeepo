'use client';

import { BOOST_LISTING_FEE, PAYMENT_PURPOSES, type PaymentPurpose } from '@offroad/shared';
import { TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ListingPremiumPaymentDialog } from '@/components/form/premium-listing-payment-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { api } from '@/lib/api';
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

export function ProductListingPremiumActions({
  product,
  onUpdated,
}: ProductListingPremiumActionsProps) {
  const router = useRouter();
  const [boostChoiceOpen, setBoostChoiceOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [boostCredits, setBoostCredits] = useState(0);
  const [usingCredit, setUsingCredit] = useState(false);

  const canUsePremium = product.status === 'ACTIVE' && !product.isAuction;

  useEffect(() => {
    if (!canUsePremium) return;
    api.users
      .profile()
      .then((profile) => setBoostCredits(profile.boostCredits ?? 0))
      .catch(() => setBoostCredits(0));
  }, [canUsePremium, product.id]);

  if (!canUsePremium) return null;

  const goToPayment = (purpose: PaymentPurpose) => {
    setPaymentOpen(false);
    setBoostChoiceOpen(false);
    router.push(buildPaymentPageUrl(product.id, purpose));
  };

  const handleUseBoostCredit = async () => {
    setUsingCredit(true);
    try {
      await api.products.applyBoostCredit(product.id);
      toast.success('آگهی با امتیاز رایگان پله شد');
      setBoostChoiceOpen(false);
      setBoostCredits((prev) => Math.max(0, prev - 1));
      await onUpdated();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'استفاده از امتیاز ناموفق بود');
    } finally {
      setUsingCredit(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-2 px-1">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="w-full gap-1 text-xs"
          onClick={() => setBoostChoiceOpen(true)}
        >
          <TrendingUp className="size-3.5" />
          پله شده
        </Button>
      </div>

      <Dialog
        open={boostChoiceOpen}
        onOpenChange={(open) => !usingCredit && setBoostChoiceOpen(open)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>پله‌شدن آگهی</DialogTitle>
            <DialogDescription asChild>
              <div className="text-foreground space-y-2 pt-1 text-start text-sm">
                <p>آگهی یک‌بار به بالای لیست منتقل می‌شود و زمان انتشار به‌روز می‌شود.</p>
                {boostCredits > 0 && (
                  <p className="text-primary font-medium">
                    امتیاز پله‌شدن رایگان: {boostCredits.toLocaleString('fa-IR')}
                  </p>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            {boostCredits > 0 && (
              <Button
                type="button"
                className="w-full"
                disabled={usingCredit}
                onClick={() => void handleUseBoostCredit()}
              >
                {usingCredit ? 'در حال اعمال...' : 'استفاده از امتیاز رایگان'}
              </Button>
            )}
            <Button
              type="button"
              variant={boostCredits > 0 ? 'outline' : 'default'}
              className="w-full"
              disabled={usingCredit}
              onClick={() => {
                setBoostChoiceOpen(false);
                setPaymentOpen(true);
              }}
            >
              پرداخت {BOOST_LISTING_FEE.toLocaleString('fa-IR')} تومان
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ListingPremiumPaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        loading={false}
        title="پرداخت هزینه پله‌شدن"
        description="آگهی یک‌بار به بالای لیست منتقل می‌شود و زمان انتشار (listedAt) به‌روز می‌شود."
        fee={BOOST_LISTING_FEE}
        onConfirm={() => goToPayment(PAYMENT_PURPOSES.LISTING_BOOST)}
      />
    </>
  );
}
