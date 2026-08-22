'use client';

import {
  BUYER_LISTING_PRICE_HINT,
  LISTING_INTENT_LABELS,
  type ListingIntent,
} from '@offroad/shared';
import { ShoppingBag } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

type ListingIntentFieldProps = {
  value: ListingIntent;
  onChange: (value: ListingIntent) => void;
};

/** Client listing role: seller by default; optional buyer checkbox. */
export function ListingIntentField({ value, onChange }: ListingIntentFieldProps) {
  const isBuyer = value === 'BUYER';

  return (
    <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
      <p className="text-sm font-medium">نوع آگهی</p>
      <p className="text-muted-foreground text-xs">
        پیش‌فرض: {LISTING_INTENT_LABELS.SELLER} — برای فروش کالا
      </p>
      <div className="flex gap-3">
        <Checkbox
          id="listing-intent-buyer"
          checked={isBuyer}
          onCheckedChange={(checked) => onChange(checked === true ? 'BUYER' : 'SELLER')}
          className="mt-0.5"
        />
        <div className="min-w-0 flex-1 space-y-1">
          <Label
            htmlFor="listing-intent-buyer"
            className="flex cursor-pointer items-center gap-1 font-normal"
          >
            <ShoppingBag className="size-4 text-sky-600" aria-hidden />
            {LISTING_INTENT_LABELS.BUYER}
          </Label>
          {isBuyer ? (
            <p className="text-muted-foreground text-xs leading-relaxed">
              {BUYER_LISTING_PRICE_HINT}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
