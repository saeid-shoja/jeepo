'use client';

import { CheckCircle2, Clock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export type ListingSubmitResultVariant = 'published' | 'pending_review';

type ListingSubmitResultDialogProps = {
  open: boolean;
  variant: ListingSubmitResultVariant;
  onGoToDashboard: () => void;
};

const COPY: Record<
  ListingSubmitResultVariant,
  { title: string; description: string; Icon: typeof CheckCircle2 }
> = {
  published: {
    title: 'آگهی با موفقیت ثبت شد',
    description: 'آگهی شما در پنل کاربری قابل مشاهده است و در سایت منتشر شده است.',
    Icon: CheckCircle2,
  },
  pending_review: {
    title: 'آگهی ثبت شد',
    description:
      'ثبت آگهی فروش خودرو و موتورسیکلت نیاز به تایید دارد. پس از بررسی دقیق قیمت و محتوا توسط تیم جیپو، آگهی تأیید و منتشر می‌شود یا در صورت عدم تأیید رد خواهد شد. نتیجه از طریق ایمیل و پنل کاربری به شما اطلاع داده می‌شود.',
    Icon: Clock,
  },
};

export function ListingSubmitResultDialog({
  open,
  variant,
  onGoToDashboard,
}: ListingSubmitResultDialogProps) {
  const { title, description, Icon } = COPY[variant];

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onGoToDashboard()}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader className="items-center text-center sm:items-center sm:text-center">
          <Icon className="text-primary mb-2 size-12" aria-hidden />
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center">
          <Button type="button" className="w-full sm:w-auto" onClick={onGoToDashboard}>
            بازگشت به پنل کاربری
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
