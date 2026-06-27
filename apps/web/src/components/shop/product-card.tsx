'use client';

import { formatPrice, isStrengthenedActive, timeAgo } from '@offroad/shared';
import { Clock, MapPin, Package, Shield, Sparkles, TrendingUp } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { AuctionProductCard } from '@/components/auction/auction-product-card';
import { AddToCartButton } from '@/components/cart/add-to-cart-button';
import { FavoriteButton } from '@/components/shop/favorite-button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { getSituationLabel, type ProductSituation } from '@/lib/product-utils';
import { canViewerPurchase } from '@/lib/purchasable';
import { useAuth } from '@/stores/auth-store';

interface ProductCardProps {
  product: {
    id: string;
    title: string;
    price: number;
    images?: string[];
    city?: string | null;
    createdAt: string | Date;
    listedAt?: string | Date;
    hasGuarantee?: boolean;
    userId?: string | null;
    situation?: ProductSituation;
    type?: string;
    advertiser?: string;
    purchasable?: boolean;
    status?: string;
    activeUntil?: string | null;
    deprecatedAt?: string | null;
    deletionAt?: string | null;
    isAuction?: boolean;
    auctionCurrentPrice?: number;
    bidCount?: number;
    auctionEndsAt?: string | null;
    hideSellerPhone?: boolean;
    isBoosted?: boolean;
    isStrengthenedActive?: boolean;
    strengthenedUntil?: string | null;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const { user } = useAuth();

  if (product.isAuction) {
    return <AuctionProductCard product={product} />;
  }

  const images = product.images || [];
  const firstImage = images[0];
  const situation = product.situation ?? (product.advertiser === 'SHOP' ? 'IN_STOCK' : null);
  const situationLabel = getSituationLabel(situation);
  const postedAt = timeAgo(new Date(product.listedAt ?? product.createdAt));
  const canBuy = canViewerPurchase(product, user?.id);
  const strengthenedActive =
    product.isStrengthenedActive ?? isStrengthenedActive(product.strengthenedUntil);

  return (
    <Card className="hover:border-primary/40 flex h-full flex-col gap-0 overflow-hidden py-0 transition-all hover:shadow-lg hover:scale-102">
      <Link href={`/product/${product.id}`} className="group block">
        <div className="relative aspect-square overflow-hidden bg-muted">
          <div className="absolute top-2 left-2 z-10">
            <FavoriteButton productId={product.id} />
          </div>
          <Image
            width={100}
            height={100}
            src={firstImage || '/images/product/no-photo.jpg'}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 border-3 border-card rounded-sm"
          />
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            {product.status === 'DEPRECATED' && (
              <Badge className="bg-red-600 text-white hover:bg-red-600">منقضی شده</Badge>
            )}
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
            {strengthenedActive && (
              <Badge className="bg-violet-600 text-white hover:bg-violet-600">
                <Sparkles className="h-3 w-3" />
                تقویت شده
              </Badge>
            )}
            {product.isBoosted && (
              <Badge className="bg-amber-500 text-white hover:bg-amber-500">
                <TrendingUp className="h-3 w-3" />
                پله شده
              </Badge>
            )}
          </div>
        </div>

        <CardContent className="space-y-2 p-3">
          <h3 className="line-clamp-2 min-h-6 text-xs leading-snug font-semibold">
            {product.title}
          </h3>

          <p className="text-foreground text-xs font-semibold">
            {formatPrice(product.price)}{' '}
            <span className="text-foreground text-xs font-normal">تومان</span>
          </p>

          <div className="text-muted-foreground flex flex-col gap-1 text-[10px]">
            <span className="flex items-center gap-0.5">
              <MapPin className="h-3 w-3 shrink-0" />
              {product.city || 'نامشخص'}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-2.5 w-2.5 shrink-0" />
              {postedAt}
            </span>
          </div>
        </CardContent>
      </Link>

      {canBuy && (
        <div className="-mb-1 border-t p-3 pt-0">
          <AddToCartButton product={product} className="w-full" size="sm" />
        </div>
      )}
    </Card>
  );
}
