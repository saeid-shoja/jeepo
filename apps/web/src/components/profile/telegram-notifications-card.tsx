'use client';

import { CheckCircle2, ExternalLink, Send } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';

type TelegramLinkState = {
  configured: boolean;
  linked: boolean;
  botUrl?: string;
  botUsername?: string;
  linkedAt?: string;
  message?: string;
};

export function TelegramNotificationsCard() {
  const [state, setState] = useState<TelegramLinkState | null>(null);
  const [loading, setLoading] = useState(true);
  const announcedLink = useRef(false);

  const load = useCallback(async (opts?: { quiet?: boolean }) => {
    if (!opts?.quiet) setLoading(true);
    try {
      const data = await api.users.telegramLink();
      setState(data);
      return data;
    } catch {
      setState({ configured: false, linked: false, message: 'خطا در بارگذاری' });
      return null;
    } finally {
      if (!opts?.quiet) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!state?.configured || state.linked) return;

    const tick = () => {
      if (document.visibilityState !== 'visible') return;
      void load({ quiet: true }).then((data) => {
        if (data?.linked && !announcedLink.current) {
          announcedLink.current = true;
          toast.success('تلگرام با موفقیت متصل شد');
        }
      });
    };

    const interval = window.setInterval(tick, 2500);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [state?.configured, state?.linked, load]);

  if (loading) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-6 text-sm">
          در حال بارگذاری وضعیت تلگرام...
        </CardContent>
      </Card>
    );
  }

  if (!state?.configured) {
    return null;
  }

  if (state.linked) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2 text-base">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-5 text-green-700" />
              تلگرام متصل است
            </div>
            {state.botUsername ? (
              <p className="text-muted-foreground text-xs font-normal" dir="ltr">
                @{state.botUsername}
              </p>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm p-4 md:p-6">
          <p className="text-muted-foreground leading-relaxed">
            اطلاعیه‌ها و پیام‌های مدیریت را در تلگرام و در تب «پیام‌ها» همین صفحه دریافت می‌کنید.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Send className="text-primary size-5" />
          دریافت اطلاعیه در تلگرام
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 text-sm">
        <p className="text-muted-foreground leading-relaxed">
          با زدن دکمه زیر ربات جیپو باز می‌شود و حساب شما خودکار وصل می‌شود. بعد از تأیید در تلگرام،
          به همین صفحه برگردید.
        </p>
        {state.botUrl ? (
          <Button type="button" className="gap-1" asChild>
            <a href={state.botUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-3.5" />
              اتصال به تلگرام
            </a>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
