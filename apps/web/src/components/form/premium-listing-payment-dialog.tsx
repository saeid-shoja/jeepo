'use client';

import { formatPrice } from '@offroad/shared';
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

type ListingPremiumPaymentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
  title: string;
  description: string;
  fee: number;
  confirmLabel?: string;
};

export function ListingPremiumPaymentDialog({
  open,
  onOpenChange,
  onConfirm,
  loading = false,
  title,
  description,
  fee,
  confirmLabel,
}: ListingPremiumPaymentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-10 sm:max-w-md"
        onPointerDownOutside={(e) => loading && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="size-5 text-amber-600" />
            {title}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="text-foreground space-y-3 pt-2 text-start text-sm">
              <p>{description}</p>
              <p className="text-primary text-2xl font-bold">
                {formatPrice(fee)}{' '}
                <span className="text-muted-foreground text-base font-normal">تومان</span>
              </p>
              <p className="text-muted-foreground text-xs">
                پس از تأیید به صفحه انتخاب درگاه پرداخت منتقل می‌شوید.
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
              (confirmLabel ?? 'ادامه به درگاه پرداخت')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
