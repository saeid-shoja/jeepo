'use client';

import {
  BOOST_LISTING_FEE,
  formatPrice,
  GUARANTEE_FEE_LABEL,
  GUARANTEE_FEE_RATE,
  GUARANTEE_LISTING_RULES,
  getGuaranteeFee,
  STRENGTHENED_DURATION_DAYS,
  STRENGTHENED_LISTING_FEE,
} from '@offroad/shared';
import { Shield, Sparkles, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

type PremiumProductOptionsProps = {
  productPrice: number;
  hasGuarantee: boolean;
  onGuaranteeChange: (value: boolean) => void;
  guaranteeDisabled?: boolean;
  /** Optional — shown as a tip only; does not block selecting guarantee. */
  guaranteeProfileMissing?: string[];
  applyStrengthened: boolean;
  onStrengthenedChange: (value: boolean) => void;
  showStrengthened?: boolean;
  showGuarantee?: boolean;
  /** پله شده — profile / legacy flows */
  showBoost?: boolean;
  isBoosted?: boolean;
  onBoostedChange?: (value: boolean) => void;
};

function ReadMoreButton({ label = 'اطلاعات بیشتر' }: { label?: string }) {
  return (
    <DialogTrigger asChild>
      <Button type="button" variant="link" className="h-auto p-0 text-xs">
        {label}
      </Button>
    </DialogTrigger>
  );
}

export function PremiumProductOptions({
  productPrice,
  hasGuarantee,
  onGuaranteeChange,
  guaranteeDisabled = false,
  guaranteeProfileMissing = [],
  applyStrengthened,
  onStrengthenedChange,
  showStrengthened = true,
  showGuarantee = true,
  showBoost = false,
  isBoosted = false,
  onBoostedChange,
}: PremiumProductOptionsProps) {
  const hasValidPrice = Number.isFinite(productPrice) && productPrice > 0;
  const guaranteeFee = getGuaranteeFee(productPrice);

  const showAnyOption =
    (showGuarantee && !guaranteeDisabled) || showStrengthened || (showBoost && onBoostedChange);

  if (!showAnyOption) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">آپشن‌های ویژه</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {showGuarantee && !guaranteeDisabled && (
          <Dialog>
            <div className="flex gap-3">
              <Checkbox
                id="has-guarantee"
                checked={hasGuarantee}
                disabled={!hasValidPrice}
                onCheckedChange={(checked) => onGuaranteeChange(checked === true)}
                className="mt-0.5"
              />
              <div className="min-w-0 flex-1 space-y-1">
                <Label
                  htmlFor="has-guarantee"
                  className={`flex cursor-pointer items-center gap-1 font-medium ${!hasValidPrice ? 'text-muted-foreground' : ''}`}
                >
                  <Shield className="size-4 text-green-600" />
                  با تضمین جیپو
                </Label>
                {!hasValidPrice ? (
                  <p className="text-xs text-amber-600">ابتدا قیمت محصول را وارد کنید.</p>
                ) : hasGuarantee ? (
                  <p className="text-xs font-medium text-green-700">
                    هزینه پس از فروش: {formatPrice(guaranteeFee)} تومان
                    <span className="text-muted-foreground font-normal">
                      {' '}
                      ({GUARANTEE_FEE_LABEL})
                    </span>
                  </p>
                ) : (
                  <p className="text-muted-foreground text-xs">
                    پس از فروش در سایت: {formatPrice(guaranteeFee)} تومان ({GUARANTEE_FEE_LABEL})
                  </p>
                )}
                {hasValidPrice && guaranteeProfileMissing.length > 0 && (
                  <div className="space-y-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-xs leading-relaxed text-blue-950 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-50">
                    <p className="font-semibold">پیشنهاد برای تسریع در تأیید:</p>
                    <p>
                      اطلاعات پروفایل شما هنوز کامل نیست. می‌توانید همین حالا درخواست تضمین بدهید؛ در
                      صورت نیاز، تیم جیپو از طریق ایمیل درخواست تکمیل پروفایل می‌کند.
                    </p>
                    <ul className="list-disc space-y-1 pr-4">
                      {guaranteeProfileMissing.map((field) => (
                        <li key={field}>{field}</li>
                      ))}
                    </ul>
                    <Link
                      href="/dashboard"
                      className="text-primary inline-block font-medium underline-offset-2 hover:underline"
                    >
                      تکمیل پروفایل در پنل کاربری
                    </Link>
                  </div>
                )}
                {hasGuarantee && (
                  <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs leading-relaxed text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-50">
                    <p className="mb-2 font-semibold">توجه — شرایط آگهی تضمین‌شده:</p>
                    <ul className="list-disc space-y-1 pr-4">
                      {GUARANTEE_LISTING_RULES.map((rule) => (
                        <li key={rule}>{rule}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <ReadMoreButton />
              </div>
            </div>
            <DialogContent className="max-h-[85vh] overflow-y-auto p-6 sm:p-10">
              <DialogHeader>
                <DialogTitle>آگهی با تضمین جیپو</DialogTitle>
                <DialogDescription asChild>
                  <div className="text-foreground space-y-3 text-start text-sm">
                    <p>
                      با فعال‌سازی تضمین جیپو، آگهی شما با نشان ویژه تضمین جیپو نمایش داده می‌شود و
                      خریداران می‌توانند مستقیماً از طریق درگاه جیپو خرید کنند. مبلغ خرید تا زمان
                      تحویل و تأیید طرفین نزد جیپو می‌ماند و سپس پس از کسر کارمزد به حساب شما واریز
                      می‌شود.
                    </p>
                    <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-50">
                      <p className="mb-2 font-semibold">شرایط انتشار:</p>
                      <ul className="list-disc space-y-1 pr-4">
                        {GUARANTEE_LISTING_RULES.map((rule) => (
                          <li key={rule}>{rule}</li>
                        ))}
                      </ul>
                    </div>
                    <p>
                      <strong>هزینه:</strong> <strong>{GUARANTEE_FEE_LABEL}</strong>
                      {hasValidPrice && (
                        <>
                          {' '}
                          (سهم {GUARANTEE_FEE_RATE.toLocaleString('fa-IR')}٪ برای این آگهی:{' '}
                          <strong>{formatPrice(guaranteeFee)} تومان</strong>)
                        </>
                      )}
                    </p>
                    <p>
                      <strong>زمان پرداخت کارمزد:</strong> پس از{' '}
                      <strong>فروش موفق در وب‌سایت</strong>، نه هنگام ثبت آگهی.
                    </p>
                    <p>
                      <strong>انتشار:</strong> آگهی تضمین‌شده ابتدا در وضعیت «در انتظار تأیید» باقی
                      می‌ماند و پس از بررسی تیم جیپو در سایت منتشر می‌شود.
                    </p>
                  </div>
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        )}

        {showStrengthened && (
          <Dialog>
            <div className="flex gap-3">
              <Checkbox
                id="apply-strengthened"
                checked={applyStrengthened}
                onCheckedChange={(checked) => onStrengthenedChange(checked === true)}
                className="mt-0.5"
              />
              <div className="min-w-0 flex-1 space-y-1">
                <Label
                  htmlFor="apply-strengthened"
                  className="flex cursor-pointer items-center gap-1 font-medium"
                >
                  <Sparkles className="size-4 text-violet-600" />
                  تقویت شده
                </Label>
                {applyStrengthened ? (
                  <p className="text-xs font-medium text-violet-700">
                    هزینه هنگام ثبت آگهی: {formatPrice(STRENGTHENED_LISTING_FEE)} تومان
                  </p>
                ) : (
                  <p className="text-muted-foreground text-xs">
                    هزینه: {formatPrice(STRENGTHENED_LISTING_FEE)} تومان —{' '}
                    {STRENGTHENED_DURATION_DAYS} روز در بالای لیست
                  </p>
                )}
                <ReadMoreButton />
              </div>
            </div>
            <DialogContent className="p-10">
              <DialogHeader>
                <DialogTitle>آگهی تقویت‌شده</DialogTitle>
                <DialogDescription asChild>
                  <div className="text-foreground space-y-3 text-start text-sm">
                    <p>
                      آگهی تقویت‌شده به مدت <strong>{STRENGTHENED_DURATION_DAYS} روز</strong> در
                      بالای همه لیست‌ها می‌ماند، حتی اگر آگهی جدیدتری ثبت شود. پس از پایان این مدت،
                      جایگاه آگهی بر اساس زمان انتشار عادی تعیین می‌شود.
                    </p>
                    <p>
                      <strong>هزینه:</strong>{' '}
                      <strong>{formatPrice(STRENGTHENED_LISTING_FEE)} تومان</strong>
                    </p>
                  </div>
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        )}

        {showBoost && onBoostedChange && (
          <Dialog>
            <div className="flex gap-3">
              <Checkbox
                id="is-boosted"
                checked={isBoosted}
                onCheckedChange={(checked) => onBoostedChange(checked === true)}
                className="mt-0.5"
              />
              <div className="min-w-0 flex-1 space-y-1">
                <Label
                  htmlFor="is-boosted"
                  className="flex cursor-pointer items-center gap-1 font-medium"
                >
                  <TrendingUp className="size-4 text-amber-600" />
                  پله شده
                </Label>
                <p className="text-muted-foreground text-xs">
                  هزینه: {formatPrice(BOOST_LISTING_FEE)} تومان — یک‌بار به بالای لیست
                </p>
                <ReadMoreButton />
              </div>
            </div>
            <DialogContent className="p-10">
              <DialogHeader>
                <DialogTitle>آگهی پله‌شده</DialogTitle>
                <DialogDescription asChild>
                  <div className="text-foreground space-y-3 text-start text-sm">
                    <p>
                      آگهی پله‌شده یک‌بار به بالای لیست محصولات آگهی شده تا تاریخ حال حاضر انتقال
                      می‌دهد و زمان انتشار (listedAt) به‌روز می‌شود.
                    </p>
                    <p>
                      <strong>هزینه:</strong>{' '}
                      <strong>{formatPrice(BOOST_LISTING_FEE)} تومان</strong>
                    </p>
                  </div>
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}
