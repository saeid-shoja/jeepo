'use client';

import { formatPrice, formatProductLocation, timeAgo } from '@offroad/shared';
import { Clock, MapPin, Shield } from 'lucide-react';
import Link from 'next/link';
import { AddToCartButton } from '@/components/cart/add-to-cart-button';
import { FavoriteButton } from '@/components/shop/favorite-button';
import { ProductMedia } from '@/components/shop/product-media';
import { ProductSituationBadge } from '@/components/shop/product-situation-badge';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { saveListScroll } from '@/lib/list-scroll-restore';
import { isShopProduct } from '@/lib/product-advertiser';
import { type ProductSituation, resolveProductSituation } from '@/lib/product-utils';
import { canViewerPurchase } from '@/lib/purchasable';
import { useAuth } from '@/stores/auth-store';

interface ProductCardProps {
  product: {
    id: string;
    title: string;
    price: number;
    images?: string[];
    city?: string | null;
    neighborhood?: string | null;
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
    stockQuantity?: number;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const { user } = useAuth();

  /* مزایده — موقتاً غیرفعال
  if (product.isAuction) {
    return <AuctionProductCard product={product} />;
  }
  */

  const images = product.images || [];
  const firstImage = images[0];
  const situation = resolveProductSituation(product);
  const postedAt = timeAgo(new Date(product.listedAt ?? product.createdAt));
  const canBuy = canViewerPurchase(product, user?.id);
  const showLocation = !isShopProduct(product);

  return (
    <Card
      data-product-id={product.id}
      className="hover:border-primary/40 flex h-full flex-col gap-0 overflow-hidden py-0 transition-all hover:shadow-lg hover:scale-102"
      dir="rtl"
    >
      <Link
        href={`/product/${product.id}`}
        className="group block"
        onClick={() => saveListScroll(product.id)}
      >
        <div className="relative aspect-square overflow-hidden bg-muted">
          <div className="absolute top-2 left-2 z-10">
            <FavoriteButton productId={product.id} />
          </div>
          <ProductMedia
            src={firstImage}
            alt={product.title}
            active={false}
            className="absolute inset-0"
            mediaClassName="object-cover transition-transform duration-300 group-hover:scale-105 border-3 border-card rounded-sm"
          />
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            {product.status === 'DEPRECATED' && (
              <Badge className="bg-red-600 text-white hover:bg-red-600">منقضی شده</Badge>
            )}
            <ProductSituationBadge situation={situation} />
            {product.hasGuarantee && (
              <Badge className="bg-green-600 text-white hover:bg-green-600">
                <Shield className="h-3 w-3" />
                تضمین شده
              </Badge>
            )}
            {/* {product.isBoosted && (
              <Badge className="bg-amber-500 text-white hover:bg-amber-500">
                <TrendingUp className="h-3 w-3" />
                پله شده
              </Badge>
            )} */}
          </div>
          {situation === 'OUT_OF_STOCK' && (
            <div className="pointer-events-none absolute inset-0 bg-background/35" aria-hidden />
          )}
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
            {showLocation ? (
              <span className="flex items-center gap-0.5">
                <MapPin className="h-3 w-3 shrink-0" />
                {formatProductLocation(product.city, product.neighborhood) || 'نامشخص'}
              </span>
            ) : null}
            <span className="flex items-center gap-1">
              <Clock className="h-2.5 w-2.5 shrink-0" />
              {postedAt}
            </span>
          </div>
        </CardContent>
      </Link>

      {canBuy && (
        <div className="border-t p-1.5 pt-0.5">
          <AddToCartButton product={product} className="w-full" size="sm" />
        </div>
      )}
    </Card>
  );
}
