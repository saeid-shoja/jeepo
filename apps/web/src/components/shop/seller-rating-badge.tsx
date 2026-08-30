'use client';

import { formatSellerRatingLabel } from '@offroad/shared';
import { BadgeCheck, Star } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type SellerRatingBadgeProps = {
  userId?: string | null;
  rating?: number | null;
  verifiedSeller?: boolean;
  className?: string;
};

/** Clickable seller rating badge → public seller profile. */
export function SellerRatingBadge({
  userId,
  rating,
  verifiedSeller,
  className,
}: SellerRatingBadgeProps) {
  if (!userId) return null;

  const label = formatSellerRatingLabel(rating);
  const content = (
    <Badge className={cn('gap-1 bg-amber-500/90 text-white hover:bg-amber-500', className)}>
      <Star className="h-3 w-3 fill-current" />
      {label}
      {verifiedSeller ? (
        <BadgeCheck className="h-3.5 w-3.5" aria-label="فروشنده احراز شده" />
      ) : null}
    </Badge>
  );

  return (
    <Link
      href={`/seller/${userId}`}
      className="inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
      aria-label="مشاهده پروفایل فروشنده"
    >
      {content}
    </Link>
  );
}
