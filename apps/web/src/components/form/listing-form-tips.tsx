'use client';

import { LISTING_TIP_NO_CONTACT_IN_TEXT, LISTING_TIP_VEHICLE_SALE_APPROVAL } from '@offroad/shared';
import { Info } from 'lucide-react';

export function ListingFormTips() {
  return (
    <div className="rounded-lg bg-secondary/50 p-4 text-sm mb-3">
      <div className="mb-2 flex items-center gap-2 font-medium">
        <Info className="size-4 shrink-0 text-destructive" aria-hidden />
        <span className="font-bold text-destructive">نکات مهم</span>
      </div>
      <ul className="list-disc space-y-2 ps-5 leading-relaxed">
        <li>{LISTING_TIP_VEHICLE_SALE_APPROVAL}</li>
        <li>{LISTING_TIP_NO_CONTACT_IN_TEXT}</li>
      </ul>
    </div>
  );
}
