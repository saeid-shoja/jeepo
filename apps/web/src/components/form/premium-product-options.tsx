'use client';

import { Shield, TrendingUp } from 'lucide-react';
import {
  BOOST_LISTING_FEE,
  formatPrice,
  getGuaranteeFee,
} from '@offroad/shared';

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
  isBoosted: boolean;
  onGuaranteeChange: (value: boolean) => void;
  onBoostedChange: (value: boolean) => void;
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
  isBoosted,
  onGuaranteeChange,
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
                  <span className="text-muted-foreground font-normal"> (۵٪ قیمت محصول)</span>
                </p>
              ) : (
                <p className="text-muted-foreground text-xs">
                  پس از فروش در سایت: {formatPrice(guaranteeFee)} تومان (۵٪ قیمت)
                </p>
              )}
              <ReadMoreButton />
            </div>
          </div>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تضمین فروشگاه</DialogTitle>
              <DialogDescription asChild>
                <div className="text-foreground space-y-3 text-start text-sm">
                  <p>
                    با فعال‌سازی تضمین فروشگاه، محصول شما با نشان ویژه نمایش داده می‌شود و
                    خریداران می‌توانند آن را مستقیماً از طریق سایت خریداری کنند.
                  </p>
                  <p>
                    <strong>هزینه:</strong> معادل{' '}
                    <strong>۵٪ قیمت فروش محصول</strong>
                    {hasValidPrice && (
                      <>
                        {' '}
                        (برای این آگهی: <strong>{formatPrice(guaranteeFee)} تومان</strong>)
                      </>
                    )}
                  </p>
                  <p>
                    <strong>زمان پرداخت:</strong> این مبلغ پس از{' '}
                    <strong>فروش موفق محصول در وب‌سایت</strong> از شما دریافت می‌شود، نه هنگام ثبت آگهی.
                  </p>
                  <p className="text-muted-foreground text-xs">
                    تا زمان فروش، هیچ هزینه‌ای بابت تضمین فروشگاه پرداخت نمی‌کنید.
                  </p>
                </div>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>

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
              {isBoosted ? (
                <p className="text-xs font-medium text-amber-700">
                  هزینه هنگام ثبت آگهی: {formatPrice(BOOST_LISTING_FEE)} تومان
                </p>
              ) : (
                <p className="text-muted-foreground text-xs">
                  هزینه ثبت: {formatPrice(BOOST_LISTING_FEE)} تومان — هنگام کلیک روی «ثبت آگهی»
                </p>
              )}
              <ReadMoreButton />
            </div>
          </div>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>آگهی پله‌شده</DialogTitle>
              <DialogDescription asChild>
                <div className="text-foreground space-y-3 text-start text-sm">
                  <p>
                    آگهی پله‌شده در بالای لیست محصولات و نتایج جستجو نمایش داده می‌شود و
                    شانس دیده شدن آگهی شما بیشتر می‌شود.
                  </p>
                  <p>
                    <strong>هزینه:</strong>{' '}
                    <strong>{formatPrice(BOOST_LISTING_FEE)} تومان</strong> به‌صورت یک‌جا
                  </p>
                  <p>
                    <strong>زمان پرداخت:</strong> پس از کلیک روی دکمه «ثبت آگهی»، پنجره
                    پرداخت نمایش داده می‌شود و پس از تأیید پرداخت، آگهی با وضعیت پله‌شده ثبت می‌شود.
                  </p>
                  <p className="text-muted-foreground text-xs">
                    در حال حاضر پرداخت به‌صورت شبیه‌سازی‌شده انجام می‌شود (بدون درگاه واقعی).
                  </p>
                </div>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
