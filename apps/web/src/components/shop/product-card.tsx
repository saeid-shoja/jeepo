'use client';

import Link from 'next/link';
import { formatPrice, timeAgo } from '@offroad/shared';
import { Clock, MapPin, Shield, Package, Sparkles } from 'lucide-react';
import { AuctionProductCard } from '@/components/auction/auction-product-card';
import { AddToCartButton } from '@/components/cart/add-to-cart-button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  getSituationLabel,
  type ProductSituation,
} from '@/lib/product-utils';
import { isPurchasable } from '@/lib/purchasable';
import Image from 'next/image';

interface ProductCardProps {
  product: {
    id: string;
    title: string;
    price: number;
    images?: string[];
    city?: string | null;
    createdAt: string | Date;
    hasGuarantee?: boolean;
    situation?: ProductSituation;
    type?: string;
    advertiser?: string;
    purchasable?: boolean;
    status?: string;
    isAuction?: boolean;
    auctionCurrentPrice?: number;
    bidCount?: number;
    auctionEndsAt?: string | null;
    hideSellerPhone?: boolean;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  if (product.isAuction) {
    return <AuctionProductCard product={product} />;
  }

  const images = product.images || [];
  const firstImage = images[0];
  const situation =
    product.situation ??
    (product.advertiser === 'SHOP' ? 'IN_STOCK' : null);
  const situationLabel = getSituationLabel(situation);
  const postedAt = timeAgo(new Date(product.createdAt));
  const canBuy = isPurchasable(product);

  return (
    <Card className="hover:border-primary/40 flex h-full flex-col gap-0 overflow-hidden py-0 transition-all hover:shadow-lg hover:scale-102">
      <Link href={`/product/${product.id}`} className="group block">
        <div className="relative aspect-square overflow-hidden bg-muted">
          <Image
            width={100}
            height={100}
            src={firstImage || '/images/product/no-photo.jpg'}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            {situationLabel && (
              <Badge
                className={
                  situation === 'IN_STOCK'
                    ? 'bg-emerald-600 text-white hover:bg-emerald-600'
                    : situation === 'USED'
                      ? 'bg-amber-600 text-white hover:bg-amber-600'
                      : 'bg-sky-600 text-white hover:bg-sky-600'
                }
              >
                {situation === 'IN_STOCK' || situation === 'USED' ? (
                  <Package className="h-3 w-3" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                {situationLabel}
              </Badge>
            )}
            {product.hasGuarantee && (
              <Badge className="bg-green-600 text-white hover:bg-green-600">
                <Shield className="h-3 w-3" />
                تضمین شده
              </Badge>
            )}
          </div>
        </div>

        <CardContent className="space-y-2 p-3">
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm leading-snug font-semibold">
            {product.title}
          </h3>

          <p className="text-primary text-lg font-bold">
            {formatPrice(product.price)}{' '}
            <span className="text-muted-foreground text-xs font-normal">تومان</span>
          </p>

          <div className="text-muted-foreground flex flex-col gap-1.5 text-xs">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {product.city || 'نامشخص'}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              {postedAt}
            </span>
          </div>
        </CardContent>
      </Link>

      {canBuy && (
        <div className="mt-auto border-t p-3 pt-0">
          <AddToCartButton
            product={product}
            className="w-full"
            size="sm"
          />
        </div>
      )}
    </Card>
  );
}
