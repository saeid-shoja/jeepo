'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false;
  const media = window.matchMedia('(display-mode: standalone)').matches;
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone;
  return media || Boolean(iosStandalone);
}

function AndroidIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <title>Android</title>
      <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24A11.46 11.46 0 0 0 12 8.25c-1.53 0-2.98.3-4.3.83L5.83 5.84c-.19-.28-.54-.37-.83-.22-.3.16-.42.54-.26.85L6.58 9.48C3.91 11.05 2.1 13.8 2 17h20c-.1-3.2-1.91-5.95-4.4-7.52zM7.5 14.25a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5zm9 0a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5z" />
    </svg>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <title>iOS</title>
      <path d="M16.37 12.68c.03 3.15 2.76 4.2 2.79 4.21-.02.07-.44 1.5-1.44 2.97-.87 1.27-1.77 2.54-3.19 2.56-1.4.03-1.85-.83-3.45-.83-1.6 0-2.1.8-3.43.86-1.38.05-2.43-1.37-3.31-2.63-1.8-2.59-3.17-7.32-1.33-10.52.92-1.59 2.56-2.59 4.34-2.62 1.35-.03 2.63.91 3.45.91.82 0 2.36-1.13 3.98-.96.68.03 2.58.27 3.8 2.07-.1.06-2.27 1.32-2.21 3.98zM14.2 4.63c.73-.88 1.22-2.11 1.09-3.33-1.05.04-2.32.7-3.07 1.58-.68.78-1.27 2.03-1.11 3.23 1.17.09 2.37-.6 3.09-1.48z" />
    </svg>
  );
}

/** Footer: both Android and iOS install actions — user chooses which guide/prompt to use. */
export function PwaInstallButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [standalone, setStandalone] = useState(true);
  const [androidOpen, setAndroidOpen] = useState(false);
  const [iosOpen, setIosOpen] = useState(false);

  useEffect(() => {
    setStandalone(isStandaloneDisplay());

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  if (standalone) return null;

  const installAndroid = async () => {
    if (deferred) {
      await deferred.prompt();
      await deferred.userChoice;
      setDeferred(null);
      setAndroidOpen(false);
      return;
    }
    setAndroidOpen(true);
  };

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <button
        type="button"
        onClick={() => void installAndroid()}
        className="text-muted-foreground hover:text-primary inline-flex items-center gap-1 text-sm transition-colors cursor-pointer"
      >
        <AndroidIcon className="size-6 shrink-0" />
        <span>اپ اندروید</span>
      </button>

      <button
        type="button"
        onClick={() => setIosOpen(true)}
        className="text-muted-foreground hover:text-primary inline-flex items-center gap-1 text-sm transition-colors cursor-pointer"
      >
        <AppleIcon className="size-5 shrink-0" />
        <span>اپ ایفون</span>
      </button>

      <Dialog open={androidOpen} onOpenChange={setAndroidOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AndroidIcon className="size-5" />
              نصب جیپو روی Android
            </DialogTitle>
            <DialogDescription className="text-start space-y-2 pt-2 text-sm leading-relaxed">
              <span className="block">۱. سایت را در Chrome یا مرورگر کرومیوم باز کنید.</span>
              <span className="block">
                ۲. از منوی ⋮ گزینه «Install app» یا «نصب برنامه» را بزنید.
              </span>
              <span className="block">۳. نصب را تأیید کنید تا آیکون جیپو روی صفحه اصلی بیاید.</span>
              {!deferred && (
                <span className="text-muted-foreground mt-2 block text-xs">
                  اگر گزینه نصب را نمی‌بینید، چند ثانیه صبر کنید یا صفحه را یک‌بار رفرش کنید.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <Dialog open={iosOpen} onOpenChange={setIosOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AppleIcon className="size-5" />
              نصب جیپو روی iPhone / iPad
            </DialogTitle>
            <DialogDescription className="text-start space-y-2 pt-2 text-sm leading-relaxed">
              <span className="block">۱. سایت را در Safari باز کنید.</span>
              <span className="block">۲. دکمه Share (مربع با فلش بالا) را بزنید.</span>
              <span className="block">
                ۳. «Add to Home Screen» یا «افزودن به صفحه اصلی» را انتخاب کنید.
              </span>
              <span className="block">۴. Add را بزنید تا آیکون جیپو روی هوم‌اسکرین ظاهر شود.</span>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
