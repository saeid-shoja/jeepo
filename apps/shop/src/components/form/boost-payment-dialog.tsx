'use client';

import { BOOST_LISTING_FEE, formatPrice } from '@offroad/shared';
import { CreditCard, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type BoostPaymentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
};

export function BoostPaymentDialog({
  open,
  onOpenChange,
  onConfirm,
  loading = false,
}: BoostPaymentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => loading && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="size-5 text-amber-600" />
            پرداخت هزینه پله‌شدن
          </DialogTitle>
          <DialogDescription asChild>
            <div className="text-foreground space-y-3 pt-2 text-start text-sm">
              <p>برای ثبت آگهی با وضعیت «پله شده»، مبلغ زیر را پرداخت کنید:</p>
              <p className="text-primary text-2xl font-bold">
                {formatPrice(BOOST_LISTING_FEE)}{' '}
                <span className="text-muted-foreground text-base font-normal">تومان</span>
              </p>
              <p className="text-muted-foreground text-xs">
                پرداخت شبیه‌سازی‌شده است. پس از تأیید، آگهی شما ثبت می‌شود.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => onOpenChange(false)}
          >
            انصراف
          </Button>
          <Button type="button" disabled={loading} onClick={() => void onConfirm()}>
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                در حال پرداخت...
              </>
            ) : (
              `پرداخت ${formatPrice(BOOST_LISTING_FEE)} تومان`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
