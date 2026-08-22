'use client';

import { productRequiresColorChoice } from '@offroad/shared';
import Link from 'next/link';
import { AddToCartButton } from '@/components/cart/add-to-cart-button';
import { FavoriteButton } from '@/components/shop/favorite-button';
import { ProductImage } from '@/components/shop/product-image';
import { ProductPriceDisplay } from '@/components/shop/product-price-display';
import { ProductSituationBadge } from '@/components/shop/product-situation-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { type ProductSituation, resolveProductSituation } from '@/lib/product-utils';
import { canViewerPurchase } from '@/lib/purchasable';
import { useAuth } from '@/stores/auth-store';

interface ProductCardProps {
  product: {
    id: string;
    title: string;
    price: number;
    salePrice?: number | null;
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
    colors?: string[];
    color?: string | null;
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
  const canBuy = canViewerPurchase(product, user?.id);
  const needsColorPick = productRequiresColorChoice(product);

  return (
    <Card className="hover:border-primary/40 flex h-full flex-col justify-between gap-0 overflow-hidden py-0 transition-all hover:shadow-lg hover:scale-102">
      <Link href={`/product/${product.id}`} className="group block">
        <div className="relative aspect-square overflow-hidden bg-muted">
          <div className="absolute top-2 left-2 z-10">
            <FavoriteButton productId={product.id} />
          </div>
          <ProductImage
            src={firstImage}
            alt={product.title}
            className="absolute inset-0"
            imageClassName="transition-transform duration-300 group-hover:scale-105 border-3 border-card rounded-sm"
          />
          <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
            <ProductSituationBadge situation={situation} />
          </div>
          {situation === 'OUT_OF_STOCK' && (
            <div className="pointer-events-none absolute inset-0 bg-background/35" aria-hidden />
          )}
        </div>

        <CardContent className="space-y-2 p-3">
          <h3 className="line-clamp-2 min-h-6 text-xs leading-snug font-semibold">
            {product.title}
          </h3>

          <ProductPriceDisplay price={product.price} salePrice={product.salePrice} variant="card" />
        </CardContent>
      </Link>

      {canBuy && (
        <div className="border-t p-1.5 pt-0.5">
          {needsColorPick ? (
            <Button asChild size="sm" className="mt-1 w-full text-[13px] hover:scale-105">
              <Link href={`/product/${product.id}`}>انتخاب رنگ</Link>
            </Button>
          ) : (
            <AddToCartButton product={product} className="w-full" size="sm" />
          )}
        </div>
      )}
    </Card>
  );
}
