'use client';

import {
  BOOST_LISTING_FEE,
  formatPrice,
  GUARANTEE_FEE_LABEL,
  getGuaranteeFee,
  STRENGTHENED_DURATION_DAYS,
  STRENGTHENED_LISTING_FEE,
} from '@offroad/shared';
import { Shield, Sparkles, TrendingUp } from 'lucide-react';
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
  applyStrengthened: boolean;
  onGuaranteeChange: (value: boolean) => void;
  onStrengthenedChange: (value: boolean) => void;
  showStrengthened?: boolean;
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
  applyStrengthened,
  onGuaranteeChange,
  onStrengthenedChange,
  showStrengthened = true,
  showBoost = false,
  isBoosted = false,
  onBoostedChange,
}: PremiumProductOptionsProps) {
  const guaranteeFee = getGuaranteeFee(productPrice);
  const hasValidPrice = productPrice > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">ویژگی‌های ویژه</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
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
                با تضمین فروشگاه
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
              <ReadMoreButton />
            </div>
          </div>
          <DialogContent className="p-10">
            <DialogHeader>
              <DialogTitle>آگهی تضمین شده</DialogTitle>
              <DialogDescription asChild>
                <div className="text-foreground space-y-3 text-start text-sm">
                  <p>
                    با فعال‌سازی تضمین فروشگاه، محصول شما با نشان ویژه دارای تضمین فروشگاه نمایش داده
                    می‌شود و خریداران می‌توانند آن را مستقیماً با ضمانت فروشگاه از طریق سایت خریداری
                    کنند. در این حالت مبلغ خرید به حساب فروشگاه واریز شده و پس از ارسال محصول توسط
                    فروشنده و تایید خریدار مبلغ با کسر کارمزد فروشگاه و مالیات به حساب فروشنده واریز
                    خواهد شد.
                  </p>
                  <p>
                    <strong>هزینه:</strong> <strong>{GUARANTEE_FEE_LABEL}</strong>
                    {hasValidPrice && (
                      <>
                        {' '}
                        (سهم ۲٪ برای این آگهی: <strong>{formatPrice(guaranteeFee)} تومان</strong>)
                      </>
                    )}
                  </p>
                  <p>
                    <strong>زمان پرداخت:</strong> این مبلغ پس از{' '}
                    <strong>فروش موفق محصول در وب‌سایت</strong> از شما دریافت می‌شود، نه هنگام ثبت
                    آگهی.
                  </p>
                </div>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>

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
                      آگهی پله‌شده یک‌بار به بالای لیست منتقل می‌شود و زمان انتشار (listedAt) به‌روز
                      می‌شود.
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
