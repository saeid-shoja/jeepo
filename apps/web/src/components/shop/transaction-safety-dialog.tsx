'use client';

import { TRANSACTION_SAFETY_WARNING } from '@offroad/shared';
import { TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type TransactionSafetyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function TransactionSafetyDialog({ open, onOpenChange }: TransactionSafetyDialogProps) {
  const copy = TRANSACTION_SAFETY_WARNING;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pt-1">
            <TriangleAlert className="size-5 shrink-0 text-amber-600" aria-hidden />
            {copy.title}
          </DialogTitle>
          <DialogDescription className="sr-only">
            راهنمای امن معامله و نشانه‌های کلاهبرداری
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 text-sm leading-relaxed text-foreground">
          <section className="space-y-2">
            <h3 className="font-semibold">{copy.commonFraudsTitle}</h3>
            <ul className="list-disc space-y-1 pr-5 text-muted-foreground">
              {copy.commonFrauds.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold">{copy.recommendationsTitle}</h3>
            <ul className="list-disc space-y-1 pr-5 text-muted-foreground">
              {copy.recommendations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold text-amber-800 dark:text-amber-200">
              {copy.cautionTitle}
            </h3>
            <ul className="list-disc space-y-1 pr-5 text-muted-foreground">
              {copy.cautionItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold">{copy.beforeTradeTitle}</h3>
            <ul className="list-disc space-y-1 pr-5 text-muted-foreground">
              {copy.beforeTradeItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="space-y-2 rounded-md border border-amber-200 bg-amber-50/80 p-3 dark:border-amber-900 dark:bg-amber-950/40">
            <h3 className="font-semibold">{copy.problemTitle}</h3>
            <p className="text-muted-foreground">{copy.problemBody}</p>
          </section>
        </div>

        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            متوجه شدم
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
