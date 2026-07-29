'use client';

import { LogIn, MessageCircle, Phone } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type AdvertiserContactDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phone: string | null | undefined;
  isAuthenticated: boolean;
};

export function AdvertiserContactDialog({
  open,
  onOpenChange,
  phone,
  isAuthenticated,
}: AdvertiserContactDialogProps) {
  const pathname = usePathname();
  const loginHref = `/login?callbackUrl=${encodeURIComponent(pathname)}`;

  if (!isAuthenticated) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogIn className="size-5 text-primary" />
              ورود به حساب
            </DialogTitle>
            <DialogDescription className="text-start pt-2">
              برای مشاهده شماره تماس آگهی‌دهنده ابتدا وارد حساب کاربری خود شوید.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              انصراف
            </Button>
            <Button type="button" asChild>
              <Link href={loginHref}>ورود</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="size-5 text-primary" />
            تماس با آگهی‌دهنده
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-4 pt-2 text-start">
              {phone ? (
                <p className="text-foreground text-xl font-bold tracking-wide" dir="ltr">
                  {phone}
                </p>
              ) : (
                <p className="text-muted-foreground text-sm">شماره تماس ثبت نشده است.</p>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        {phone && (
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button type="button" className="w-full gap-2" asChild>
              <a href={`tel:${phone}`}>
                <Phone className="size-4" />
                تماس
              </a>
            </Button>
            <Button type="button" variant="outline" className="w-full gap-2" asChild>
              <a href={`sms:${phone}`}>
                <MessageCircle className="size-4" />
                پیام
              </a>
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
