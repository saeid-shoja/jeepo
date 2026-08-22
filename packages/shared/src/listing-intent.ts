export const LISTING_INTENTS = ['SELLER', 'BUYER'] as const;
export type ListingIntent = (typeof LISTING_INTENTS)[number];

export const LISTING_INTENT_LABELS: Record<ListingIntent, string> = {
  SELLER: 'فروشنده',
  BUYER: 'خریدار',
};

export function isBuyerListing(intent?: ListingIntent | string | null): boolean {
  return intent === 'BUYER';
}

/** Shown when user marks a client listing as a buyer request. */
export const BUYER_LISTING_PRICE_HINT =
  'بهتر است بازه قیمتی محصول درخواستی را در توضیحات آگهی ذکر کنید.';
