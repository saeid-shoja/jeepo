'use client';

import { Gavel } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { PriceInput } from '@/components/form/price-input';
import {
  DateTimePicker,
  dateTimeLocalToIso,
  defaultMinDateTimeLocal,
} from '@/components/form/datetime-picker';

export type AuctionListingFields = {
  isAuction: boolean;
  auctionStartPrice: number;
  auctionEndsAtLocal: string;
  realPriceMin: number;
  realPriceMax: number;
  buyNowPrice: number;
};

type AuctionListingOptionsProps = {
  value: AuctionListingFields;
  onChange: (patch: Partial<AuctionListingFields>) => void;
};

export function AuctionListingOptions({ value, onChange }: AuctionListingOptionsProps) {
  return (
    <Card className="border-violet-200/60 dark:border-violet-900/40">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Checkbox
            id="is-auction"
            checked={value.isAuction}
            onCheckedChange={(checked) =>
              onChange({
                isAuction: checked === true,
                auctionEndsAtLocal: value.auctionEndsAtLocal || defaultMinDateTimeLocal(),
              })
            }
          />
          <div className="space-y-0.5">
            <Label htmlFor="is-auction" className="flex cursor-pointer items-center gap-2 text-base font-semibold">
              <Gavel className="text-violet-600 size-5" />
              ثبت به‌صورت مزایده
            </Label>
            <p className="text-muted-foreground text-xs font-normal">
              با فعال‌سازی، آگهی در بخش «مزایده‌ها» نمایش داده می‌شود و شماره تماس نمایش داده نمی‌شود
            </p>
          </div>
        </div>
      </CardHeader>

      {value.isAuction && (
        <CardContent className="space-y-4 border-t pt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="auction-start">قیمت شروع مزایده (تومان)</Label>
              <PriceInput
                id="auction-start"
                value={value.auctionStartPrice}
                onChange={(v) => onChange({ auctionStartPrice: v })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buy-now">قیمت خرید فوری (تومان)</Label>
              <PriceInput
                id="buy-now"
                value={value.buyNowPrice}
                onChange={(v) => onChange({ buyNowPrice: v })}
                required
              />
              <p className="text-muted-foreground text-xs">خریدار می‌تواند بدون شرکت در مزایده بخرد</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="real-min">حداقل قیمت واقعی بازار (تومان)</Label>
              <PriceInput
                id="real-min"
                value={value.realPriceMin}
                onChange={(v) => onChange({ realPriceMin: v })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="real-max">حداکثر قیمت واقعی بازار (تومان)</Label>
              <PriceInput
                id="real-max"
                value={value.realPriceMax}
                onChange={(v) => onChange({ realPriceMax: v })}
                required
              />
            </div>
          </div>

          <DateTimePicker
            value={value.auctionEndsAtLocal}
            onChange={(v) => onChange({ auctionEndsAtLocal: v })}
            min={defaultMinDateTimeLocal()}
            required
            hint="پس از این زمان، ثبت پیشنهاد جدید بسته می‌شود"
          />
        </CardContent>
      )}
    </Card>
  );
}

export function validateAuctionListing(fields: AuctionListingFields): string | null {
  if (!fields.isAuction) return null;
  if (fields.auctionStartPrice <= 0) return 'قیمت شروع مزایده را وارد کنید';
  if (fields.buyNowPrice <= 0) return 'قیمت خرید فوری را وارد کنید';
  if (fields.buyNowPrice <= fields.auctionStartPrice) {
    return 'قیمت خرید فوری باید بیشتر از قیمت شروع باشد';
  }
  if (fields.realPriceMin <= 0 || fields.realPriceMax <= 0) {
    return 'بازه قیمت واقعی را کامل وارد کنید';
  }
  if (fields.realPriceMin > fields.realPriceMax) {
    return 'حداقل قیمت واقعی نمی‌تواند بیشتر از حداکثر باشد';
  }
  if (!fields.auctionEndsAtLocal) return 'زمان پایان مزایده را انتخاب کنید';
  const ends = new Date(dateTimeLocalToIso(fields.auctionEndsAtLocal));
  if (ends.getTime() <= Date.now()) return 'زمان پایان باید در آینده باشد';
  return null;
}
