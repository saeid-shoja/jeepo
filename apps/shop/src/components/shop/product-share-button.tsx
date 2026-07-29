'use client';

import { Check, Copy, MessageCircle, MessageSquare, Send, Share2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

type ProductShareButtonProps = {
  productId: string;
  title: string;
  className?: string;
};

function buildProductUrl(productId: string): string {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/product/${productId}`;
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

function usePrefersMobileShare(): boolean {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px), (hover: none) and (pointer: coarse)');
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return mobile;
}

export function ProductShareButton({ productId, title, className }: ProductShareButtonProps) {
  const prefersMobileShare = usePrefersMobileShare();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const url = useMemo(() => buildProductUrl(productId), [productId]);
  const shareText = title.trim() || 'آگهی در جیپو';

  const handleCopy = async () => {
    const ok = await copyText(url);
    if (ok) {
      setCopied(true);
      toast.success('لینک آگهی کپی شد');
      window.setTimeout(() => setCopied(false), 2000);
      setSheetOpen(false);
    } else {
      toast.error('کپی لینک ناموفق بود');
    }
  };

  const handleClick = () => {
    if (prefersMobileShare) {
      setSheetOpen(true);
      return;
    }
    void handleCopy();
  };

  const telegramHref = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}`;
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${url}`)}`;
  const smsHref = `sms:?&body=${encodeURIComponent(`${shareText}\n${url}`)}`;

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          'size-9 shrink-0 text-gray-500 hover:bg-gray-100 hover:text-foreground',
          className,
        )}
        aria-label="اشتراک‌گذاری آگهی"
        title="اشتراک‌گذاری"
        onClick={handleClick}
      >
        {copied && !prefersMobileShare ? (
          <Check className="h-4 w-4 text-green-600" aria-hidden />
        ) : (
          <Share2 className="h-4 w-4" aria-hidden />
        )}
      </Button>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-xl">
          <SheetHeader>
            <SheetTitle>اشتراک‌گذاری آگهی</SheetTitle>
            <SheetDescription className="line-clamp-2">{shareText}</SheetDescription>
          </SheetHeader>

          <div className="mt-4 grid gap-2 pb-4">
            <a
              href={telegramHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium transition-colors hover:bg-muted"
              onClick={() => setSheetOpen(false)}
            >
              <Send className="size-5 text-sky-600" aria-hidden />
              تلگرام
            </a>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium transition-colors hover:bg-muted"
              onClick={() => setSheetOpen(false)}
            >
              <MessageCircle className="size-5 text-green-600" aria-hidden />
              واتساپ
            </a>
            <a
              href={smsHref}
              className="flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium transition-colors hover:bg-muted"
              onClick={() => setSheetOpen(false)}
            >
              <MessageSquare className="size-5 text-violet-600" aria-hidden />
              پیامک
            </a>
            <button
              type="button"
              className="flex items-center gap-3 rounded-lg border px-4 py-3 text-start text-sm font-medium transition-colors hover:bg-muted"
              onClick={() => void handleCopy()}
            >
              <Copy className="size-5 text-foreground" aria-hidden />
              کپی لینک
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
