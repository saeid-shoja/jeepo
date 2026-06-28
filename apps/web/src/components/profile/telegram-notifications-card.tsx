'use client';

import { CheckCircle2, ExternalLink, Send } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.users.telegramLink();
      setState(data);
    } catch {
      setState({ configured: false, linked: false, message: 'خطا در بارگذاری' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        در حال بارگذاری وضعیت تلگرام...
      </div>
    );
  }

  if (!state?.configured) {
    return null;
  }

  if (state.linked) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50/50 p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green-600" />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-green-900">تلگرام متصل است</p>
            <p className="text-muted-foreground mt-1 text-sm">
              اطلاعیه‌ها و پیام‌های مدیریت در تب «پیام‌ها» همین صفحه نمایش داده می‌شوند.
              {state.botUsername ? ` (@${state.botUsername})` : ''}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Send className="text-primary mt-0.5 size-5 shrink-0" />
          <div>
            <p className="font-medium">دریافت اطلاعیه در تلگرام</p>
            <p className="text-muted-foreground mt-1 text-sm">
              ربات را استارت کنید تا اخبار و پیام‌های مدیریت را در تلگرام بگیرید.
            </p>
          </div>
        </div>
        {state.botUrl && (
          <Button type="button" variant="outline" className="shrink-0 gap-2" asChild>
            <a href={state.botUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-4" />
              اتصال تلگرام
            </a>
          </Button>
        )}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="mt-2 text-xs"
        onClick={() => {
          void load().then(() => toast.message('وضعیت اتصال به‌روز شد'));
        }}
      >
        بررسی مجدد اتصال
      </Button>
    </div>
  );
}
