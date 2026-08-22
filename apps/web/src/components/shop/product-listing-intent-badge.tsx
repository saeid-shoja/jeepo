import { isBuyerListing, LISTING_INTENT_LABELS, type ListingIntent } from '@offroad/shared';
import { ShoppingBag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function ProductListingIntentBadge({
  listingIntent,
}: {
  listingIntent?: ListingIntent | string | null;
}) {
  if (!isBuyerListing(listingIntent)) return null;

  return (
    <Badge className="bg-sky-600 text-white hover:bg-sky-600">
      <ShoppingBag className="h-3 w-3" />
      {LISTING_INTENT_LABELS.BUYER}
    </Badge>
  );
}
