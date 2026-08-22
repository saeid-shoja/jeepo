'use client';

import { GUARANTEE_BUYER_INFO } from '@offroad/shared';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type GuaranteeInfoDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function GuaranteeInfoDialog({ open, onOpenChange }: GuaranteeInfoDialogProps) {
  const copy = GUARANTEE_BUYER_INFO;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] w-[calc(100%-2rem)] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pt-1">
            <Shield className="size-5 shrink-0 text-green-600" aria-hidden />
            {copy.title}
          </DialogTitle>
          <DialogDescription className="sr-only">توضیحات تضمین جیپو برای خریدار</DialogDescription>
        </DialogHeader>

        <ul className="list-disc space-y-2 pr-5 text-sm leading-relaxed text-foreground">
          {copy.items.map((item) => (
            <li key={item} className="text-muted-foreground">
              <span className="text-foreground">{item}</span>
            </li>
          ))}
        </ul>

        <DialogFooter>
          <Button type="button" className="w-full sm:w-auto" onClick={() => onOpenChange(false)}>
            متوجه شدم
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
