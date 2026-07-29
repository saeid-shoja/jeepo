'use client';

import { REFERRALS_PER_BOOST_CREDIT } from '@offroad/shared';
import { Copy, UserPlus } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type ReferralInviteCardProps = {
  referralCode?: string | null;
  referralCount?: number;
  boostCredits?: number;
};

export function ReferralInviteCard({
  referralCode,
  referralCount = 0,
  boostCredits = 0,
}: ReferralInviteCardProps) {
  const inviteUrl = useMemo(() => {
    if (!referralCode || typeof window === 'undefined') return '';
    const url = new URL('/register', window.location.origin);
    url.searchParams.set('ref', referralCode);
    return url.toString();
  }, [referralCode]);

  const copyInviteLink = useCallback(async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      toast.success('لینک دعوت کپی شد');
    } catch {
      toast.error('کپی لینک ناموفق بود');
    }
  }, [inviteUrl]);

  const copyReferralCode = useCallback(async () => {
    if (!referralCode) return;
    try {
      await navigator.clipboard.writeText(referralCode);
      toast.success('کد معرف کپی شد');
    } catch {
      toast.error('کپی کد ناموفق بود');
    }
  }, [referralCode]);

  if (!referralCode) return null;

  return (
    <Card>
      <CardHeader className="">
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          <div className="flex items-center gap-2">
            <UserPlus className="size-5 text-primary" />
            معرفی دوستان
          </div>
          <div className="flex items-center gap-1">
            <p className="text-muted-foreground text-xs">امتیاز شما:</p>
            <p className="text-lg font-bold text-primary">{boostCredits.toLocaleString('fa-IR')}</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 h-full text-sm flex flex-col justify-between">
        <p className="text-muted-foreground leading-relaxed">
          {`با دعوت دوستان، به ازای هر ثبت‌نام موفق ${REFERRALS_PER_BOOST_CREDIT.toLocaleString('fa-IR')} امتیاز پله‌ کردن رایگان آگهی خود دریافت می‌کنید. با استفاده از این امتیاز شما با هر امتیاز میتوانید از مزایای پله کردن آگهی استفاده کنید.`}{' '}
          {referralCount > 0
            ? `تاکنون ${referralCount.toLocaleString('fa-IR')} نفر با کد شما ثبت‌نام کرده‌اند.`
            : null}
        </p>
        <div className="grid gap-3 grid-cols-2">
          <div className="border bg-muted/30 flex gap-1 items-center px-2">
            <p className="text-muted-foreground text-xs">کد معرفی:</p>
            <button
              type="button"
              className="font-mono text-sm font-bold tracking-widest"
              onClick={() => void copyReferralCode()}
            >
              {referralCode}
            </button>
          </div>
          <Button type="button" size="sm" className="gap-1" onClick={() => void copyInviteLink()}>
            <Copy className="size-3" />
            کپی لینک دعوت
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
