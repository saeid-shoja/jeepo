'use client';

import { Flag, Loader2, LogIn } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';

type ReportProductDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productTitle: string;
  isAuthenticated: boolean;
};

export function ReportProductDialog({
  open,
  onOpenChange,
  productId,
  productTitle,
  isAuthenticated,
}: ReportProductDialogProps) {
  const pathname = usePathname();
  const loginHref = `/login?callbackUrl=${encodeURIComponent(pathname)}`;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setTitle('');
    setDescription('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await api.products.report(productId, { title, description });
      toast.success(result.message);
      resetForm();
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'ارسال گزارش ناموفق بود');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 pt-3">
              <LogIn className="size-5 text-primary" />
              ورود به حساب
            </DialogTitle>
            <DialogDescription className="text-start pt-2">
              برای گزارش تخلف آگهی ابتدا وارد حساب کاربری خود شوید.
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
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!submitting) {
          if (!next) resetForm();
          onOpenChange(next);
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="size-5 text-destructive" />
              گزارش تخلف آگهی
            </DialogTitle>
            <DialogDescription className="text-start pt-2">
              گزارش شما همراه با اطلاعات آگهی «{productTitle}» برای تیم پشتیبانی ارسال می‌شود.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="report-title">عنوان گزارش</Label>
              <Input
                id="report-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثلاً: قیمت گمراه‌کننده"
                required
                minLength={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-description">توضیحات</Label>
              <Textarea
                id="report-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="جزئیات مشکل را بنویسید..."
                rows={4}
                required
                minLength={10}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => onOpenChange(false)}
            >
              انصراف
            </Button>
            <Button type="submit" variant="destructive" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  در حال ارسال...
                </>
              ) : (
                'ارسال گزارش'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
