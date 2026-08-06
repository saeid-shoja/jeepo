'use client';

import {
  BOOST_LISTING_FEE,
  formatPrice,
  STRENGTHENED_DURATION_DAYS,
  STRENGTHENED_LISTING_FEE,
} from '@offroad/shared';
import { Sparkles, TrendingUp } from 'lucide-react';
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
  applyStrengthened: boolean;
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

/**
 * Client listing premiums (strengthen / boost).
 * Shop-guarantee badge is admin-only and is not offered here.
 */
export function PremiumProductOptions({
  applyStrengthened,
  onStrengthenedChange,
  showStrengthened = true,
  showBoost = false,
  isBoosted = false,
  onBoostedChange,
}: PremiumProductOptionsProps) {
  if (!showStrengthened && !(showBoost && onBoostedChange)) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">آپشن های ویژه</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
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
                      <strong>هزینه:</strong> <strong>{formatPrice(BOOST_LISTING_FEE)} تومان</strong>
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
