'use client';

import { Bell, BellOff, CheckCircle2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import {
  getPushSubscriptionState,
  isPushSupported,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
} from '@/lib/push-notifications';

type PushState = 'loading' | 'unsupported' | 'disabled' | 'denied' | 'subscribed' | 'unsubscribed';

export function PushNotificationsCard() {
  const [state, setState] = useState<PushState>('loading');
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!isPushSupported()) {
      setState('unsupported');
      return;
    }

    try {
      const config = await api.users.pushConfig();
      if (!config.enabled) {
        setState('disabled');
        return;
      }
      const subState = await getPushSubscriptionState();
      setState(subState);
    } catch {
      setState('disabled');
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleEnable = async () => {
    setBusy(true);
    try {
      const ok = await subscribeToPushNotifications();
      if (ok) {
        toast.success('اعلان‌های مرورگر فعال شد');
        setState('subscribed');
      } else {
        toast.error('فعال‌سازی اعلان‌ها ناموفق بود');
        await refresh();
      }
    } catch {
      toast.error('فعال‌سازی اعلان‌ها ناموفق بود');
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = async () => {
    setBusy(true);
    try {
      await unsubscribeFromPushNotifications();
      toast.success('اعلان‌های مرورگر غیرفعال شد');
      setState('unsubscribed');
    } catch {
      toast.error('غیرفعال‌سازی اعلان‌ها ناموفق بود');
    } finally {
      setBusy(false);
    }
  };

  if (state === 'loading') {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-6 text-sm">
          در حال بارگذاری وضعیت اعلان‌ها...
        </CardContent>
      </Card>
    );
  }

  if (state === 'unsupported' || state === 'disabled') {
    return null;
  }

  if (state === 'subscribed') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle2 className="size-5 text-green-700" />
            اعلان مرورگر فعال است
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="text-muted-foreground leading-relaxed">
            پیام‌های چت و اطلاعیه‌های سایت روی تلفن یا مرورگر شما (بعد از نصب PWA) نمایش داده می‌شوند.
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => void handleDisable()}
          >
            <BellOff className="size-3" />
            غیرفعال کردن
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="text-primary size-5" />
          اعلان روی تلفن / مرورگر
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p className="text-muted-foreground leading-relaxed">
          با فعال‌سازی اعلان، پیام‌های چت و اطلاعیه‌های جیپو مستقیم روی دستگاه شما (حتی وقتی سایت بسته
          است) نمایش داده می‌شوند. برای بهترین تجربه، ابتدا جیپو را از منوی مرورگر «Add to Home
          Screen» نصب کنید.
        </p>
        {state === 'denied' ? (
          <p className="text-destructive text-xs leading-relaxed">
            اعلان‌ها در مرورگر مسدود شده‌اند. از تنظیمات مرورگر اجازه اعلان را برای jeepo.ir فعال
            کنید.
          </p>
        ) : (
          <Button type="button" size="sm" disabled={busy} onClick={() => void handleEnable()}>
            <Bell className="size-3" />
            فعال‌سازی اعلان
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
