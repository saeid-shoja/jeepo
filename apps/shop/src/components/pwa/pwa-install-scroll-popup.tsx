'use client';

import { Download, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SiteLogo } from '@/components/layout/site-logo';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { isPwaInstallDismissed, markPwaInstallDismissed } from '@/lib/pwa-install-dismiss';
import { cn } from '@/lib/utils';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

type GuideMode = 'android' | 'ios';

function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false;
  const media = window.matchMedia('(display-mode: standalone)').matches;
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone;
  return media || Boolean(iosStandalone);
}

function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

const guideDialogClass =
  'top-auto bottom-10 left-1/2 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 translate-y-0 gap-4 p-5 sm:max-w-sm sm:p-6 pt-10';

export function PwaInstallScrollPopup() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [standalone, setStandalone] = useState(true);
  const [bannerDismissed, setBannerDismissed] = useState(true);
  const [visible, setVisible] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideMode, setGuideMode] = useState<GuideMode>('android');
  const [isMobile, setIsMobile] = useState(false);
  const lastYRef = useRef(0);

  const dismissBannerPermanently = useCallback(() => {
    markPwaInstallDismissed();
    setBannerDismissed(true);
    setVisible(false);
  }, []);

  useEffect(() => {
    setStandalone(isStandaloneDisplay());
    setBannerDismissed(isPwaInstallDismissed());
    setIsMobile(window.matchMedia('(max-width: 767px)').matches);
    lastYRef.current = window.scrollY;

    const onResize = () => setIsMobile(window.matchMedia('(max-width: 767px)').matches);
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const onAppInstalled = () => dismissBannerPermanently();

    const onScroll = () => {
      if (!isMobile || standalone || isPwaInstallDismissed()) return;
      const y = window.scrollY;
      const delta = y - lastYRef.current;
      if (y > 220 && delta > 8) {
        setVisible(true);
      } else if (delta < -8) {
        setVisible(false);
      }
      lastYRef.current = y;
    };

    window.addEventListener('resize', onResize);
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onAppInstalled);
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onAppInstalled);
      window.removeEventListener('scroll', onScroll);
    };
  }, [dismissBannerPermanently, isMobile, standalone]);

  if (!isMobile || standalone) return null;

  const openGuide = () => {
    dismissBannerPermanently();
    setGuideMode(isIosDevice() ? 'ios' : 'android');
    setGuideOpen(true);
  };

  const installAndroidDirect = async () => {
    dismissBannerPermanently();
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setGuideOpen(false);
  };

  return (
    <>
      {!bannerDismissed ? (
        <div
          className={cn(
            'safe-area-pb fixed right-3 bottom-3 left-3 z-40 transition-all duration-300 sm:hidden',
            visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-6 opacity-0',
          )}
        >
          <div className="bg-card/95 border-border/80 rounded-2xl border p-3 shadow-xl backdrop-blur">
            <div className="flex items-start gap-3">
              <SiteLogo href="" size="xs" imageClassName="h-10 w-10" className="shrink-0" />
              <div className="min-w-0 flex-1 text-right">
                <p className="text-sm font-semibold">نصب وب اپلیکیشن جیپو</p>
                <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                  برای دسترسی سریع‌تر، جیپو را روی گوشی نصب کنید.
                </p>
                <button
                  type="button"
                  onClick={openGuide}
                  className="bg-primary text-primary-foreground mt-2 inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium"
                >
                  <Download className="size-3.5" />
                  نصب اپ
                </button>
              </div>
              <button
                type="button"
                aria-label="بستن"
                onClick={dismissBannerPermanently}
                className="text-muted-foreground hover:text-foreground shrink-0 rounded-md p-1"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <Dialog open={guideOpen} onOpenChange={setGuideOpen}>
        <DialogContent className={guideDialogClass}>
          <DialogHeader className="text-right sm:text-right">
            {guideMode === 'android' ? (
              <>
                <DialogTitle className="text-right">نصب جیپو روی Android</DialogTitle>
                <DialogDescription className="space-y-2 pt-1 text-right text-sm leading-relaxed">
                  <span className="block">۱. سایت را در Chrome یا مرورگر کرومیوم باز کنید.</span>
                  <span className="block">
                    ۲. از منوی ⋮ گزینه «Install app» یا «نصب برنامه» را بزنید.
                  </span>
                  <span className="block">
                    ۳. نصب را تأیید کنید تا آیکون جیپو روی صفحه اصلی بیاید.
                  </span>
                  {!deferred && (
                    <span className="text-muted-foreground mt-1 block text-xs">
                      اگر گزینه نصب را نمی‌بینید، چند ثانیه صبر کنید یا صفحه را یک‌بار رفرش کنید.
                    </span>
                  )}
                </DialogDescription>
              </>
            ) : (
              <>
                <DialogTitle className="text-right">نصب جیپو روی iPhone / iPad</DialogTitle>
                <DialogDescription className="space-y-2 pt-1 text-right text-sm leading-relaxed">
                  <span className="block">۱. سایت را در Safari باز کنید.</span>
                  <span className="block">۲. دکمه Share را بزنید.</span>
                  <span className="block">
                    ۳. «Add to Home Screen» یا «افزودن به صفحه اصلی» را انتخاب کنید.
                  </span>
                  <span className="block">
                    ۴. Add را بزنید تا آیکون جیپو روی هوم‌اسکرین ظاهر شود.
                  </span>
                </DialogDescription>
              </>
            )}
          </DialogHeader>

          {guideMode === 'android' && deferred ? (
            <DialogFooter className="sm:justify-start">
              <Button
                type="button"
                className="w-full sm:w-auto"
                onClick={() => void installAndroidDirect()}
              >
                نصب مستقیم
              </Button>
            </DialogFooter>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
