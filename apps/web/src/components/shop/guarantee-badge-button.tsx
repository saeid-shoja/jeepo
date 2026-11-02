'use client';

import { Shield } from 'lucide-react';
import Link from 'next/link';
import type * as React from 'react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const GUARANTEE_BADGE_LABEL = 'خرید مطمین از راه دور';

const GUARANTEE_BADGE_DIALOG_BODY = [
  'شما میتوانید برای یک معامله مطمین از فروشنده کالا هایی که قیمت آن ها کمتر از ۱۰۰ میلیون می باشد و قابلیت ارسال برای آن ها فراهم است بخواهید تا ایشان از تضمین جیپو برای آگهی خود استفاده کنند.',
  'در این صورت شما توافقات کامل را انجام داده و قیمت نهایی روی آگهی توسط فروشنده ثبت خواهد شد. در این صورت شما مستقیم آن محصول را از سایت جیپو خرید میکنید و تا زمان رسیدن محصول به شما این مبلغ نزد جیپو به امانت می ماند و پس از تایید ارسال به فروشنده پرداخت می شود.',
  'برای ادامه قوانین تضمین جیپو به بخش قوانین جیپو مراجعه کنید.',
];

function renderParagraph(paragraph: string, onClose: () => void) {
  const segments = paragraph.split('تضمین جیپو');
  const result: React.ReactNode[] = [];
  segments.forEach((part, index) => {
    if (index > 0) {
      result.push(
        <Link
          key={`link-${index}`}
          href="/roles"
          className="text-primary font-medium underline-offset-4 hover:underline"
          onClick={onClose}
        >
          تضمین جیپو
        </Link>,
      );
    }
    if (part) {
      result.push(<span key={`seg-${index}`}>{part}</span>);
    }
  });
  return <p className="text-muted-foreground">{result}</p>;
}

export function GuaranteeBadgeButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Badge
        variant="destructive"
        className="cursor-pointer select-none hover:bg-destructive/90"
        onClick={() => setOpen(true)}
      >
        <Shield className="size-3" />
        {GUARANTEE_BADGE_LABEL}
      </Badge>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] w-[calc(100%-2rem)] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 pt-1">
              <Shield className="size-5 shrink-0 text-destructive" aria-hidden />
              چطور ریسک خرید از راه دور را کم کنیم؟
            </DialogTitle>
            <DialogDescription className="sr-only">
              راهنمای کاهش ریسک خرید از راه دور با تضمین جیپو
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm leading-relaxed text-foreground">
            {GUARANTEE_BADGE_DIALOG_BODY.map((paragraph) =>
              renderParagraph(paragraph, () => setOpen(false)),
            )}
          </div>

          <DialogFooter>
            <Button type="button" className="w-full sm:w-auto" onClick={() => setOpen(false)}>
              متوجه شدم
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
