'use client';

import { Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type DeleteListingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingTitle: string;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
};

export function DeleteListingDialog({
  open,
  onOpenChange,
  listingTitle,
  loading = false,
  onConfirm,
}: DeleteListingDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !loading && onOpenChange(next)}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => loading && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive pt-3">
            <Trash2 className="size-5" />
            حذف آگهی
          </DialogTitle>
          <DialogDescription asChild>
            <p className="text-foreground pt-1 text-start text-sm leading-relaxed">
              آگهی «<span className="font-medium">{listingTitle}</span>» حذف شود؟ این عمل قابل
              بازگشت نیست.
            </p>
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
          <Button
            type="button"
            variant="destructive"
            disabled={loading}
            onClick={() => void onConfirm()}
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                در حال حذف...
              </>
            ) : (
              'حذف آگهی'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
