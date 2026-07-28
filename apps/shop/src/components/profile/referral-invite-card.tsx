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
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <UserPlus className="size-5 text-primary" />
          معرفی دوستان
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p className="text-muted-foreground leading-relaxed">
          {`با دعوت دوستان، به ازای هر ثبت‌نام موفق ${REFERRALS_PER_BOOST_CREDIT.toLocaleString('fa-IR')} امتیاز پله‌ کردن رایگان آگهی خود دریافت می‌کنید. با استفاده از این امتیاز شما با هر امتیاز میتوانید از مزایای پله کردن آگهی استفاده کنید.`}
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border bg-muted/30 p-3">
            <p className="text-muted-foreground text-xs">دعوت‌شده‌ها</p>
            <p className="text-lg font-bold">{referralCount.toLocaleString('fa-IR')}</p>
          </div>
          <div className="rounded-md border bg-muted/30 p-3">
            <p className="text-muted-foreground text-xs">امتیاز پله‌شدن</p>
            <p className="text-lg font-bold">{boostCredits.toLocaleString('fa-IR')}</p>
          </div>
          <div className="rounded-md border bg-muted/30 p-3">
            <p className="text-muted-foreground text-xs">کد معرف شما</p>
            <p className="font-mono text-base font-bold tracking-widest" dir="ltr">
              {referralCode}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" className="gap-1" onClick={() => void copyInviteLink()}>
            <Copy className="size-4" />
            کپی لینک ثبت‌نام
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1"
            onClick={() => void copyReferralCode()}
          >
            <Copy className="size-4" />
            کپی کد معرف
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
