'use client';

import { CheckCircle2, ExternalLink, Send } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';

type TelegramLinkState = {
  configured: boolean;
  linked: boolean;
  linkCode?: string;
  botUrl?: string;
  botUsername?: string;
  linkedAt?: string;
  message?: string;
};

export function TelegramNotificationsCard() {
  const [state, setState] = useState<TelegramLinkState | null>(null);
  const [loading, setLoading] = useState(true);

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

  const copyLinkCode = useCallback(async () => {
    if (!state?.linkCode) return;
    try {
      await navigator.clipboard.writeText(state.linkCode);
      toast.success('کد اتصال کپی شد');
    } catch {
      toast.error('کپی کد ناموفق بود');
    }
  }, [state?.linkCode]);

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
        <CardContent className="space-y-4 text-sm">
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
      <CardContent className="space-y-4 text-sm">
        <p className="text-muted-foreground leading-relaxed">
          ۱. کد زیر را کپی کنید.
          <br />
          ۲. ربات را باز کنید و همان کد را در چت بفرستید.
          <br />
          ۳. بعد از پیام موفقیت، «بررسی اتصال» را بزنید.
          <br />
          {state.linkCode ? (
            <div className="flex items-center gap-2 min-w-0">
              <p className="text-muted-foreground text-xs shrink-0"> ۴. برای کپی روی کد بزنید:</p>
              <button
                type="button"
                onClick={() => void copyLinkCode()}
                className="font-mono text-base font-bold tracking-[0.2em]"
                dir="ltr"
              >
                {state.linkCode}
              </button>
            </div>
          ) : null}
        </p>
        <div className="grid grid-cols-2 gap-3">
          {state.botUrl ? (
            <Button type="button" size="sm" className="gap-1" asChild>
              <a href={state.botUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-3" />
                باز کردن ربات
              </a>
            </Button>
          ) : (
            <div />
          )}
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1"
            onClick={() => {
              void load({ quiet: true }).then((data) => {
                if (data?.linked) {
                  toast.success('تلگرام با موفقیت متصل شد');
                } else {
                  toast.message('هنوز متصل نشده — کد را در ربات بفرستید و دوباره بررسی کنید');
                }
              });
            }}
          >
            بررسی اتصال
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
