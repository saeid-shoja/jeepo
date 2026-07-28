'use client';

import { formatAuctionCountdown, formatPrice, formatProductLocation } from '@offroad/shared';
import { Clock, Gavel, MapPin, Users } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FavoriteButton } from '@/components/shop/favorite-button';
import { ProductImage } from '@/components/shop/product-image';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { saveListScroll } from '@/lib/list-scroll-restore';

type AuctionProductCardProps = {
  product: {
    id: string;
    title: string;
    price: number;
    auctionCurrentPrice?: number;
    images?: string[];
    city?: string | null;
    neighborhood?: string | null;
    auctionEndsAt?: string | null;
    bidCount?: number;
    auctionActive?: boolean;
    status?: string;
  };
};

export function AuctionProductCard({ product }: AuctionProductCardProps) {
  const images = product.images || [];
  const firstImage = images[0];
  const currentPrice = product.auctionCurrentPrice ?? product.price;
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    if (!product.auctionEndsAt) return;
    const tick = () => setCountdown(formatAuctionCountdown(product.auctionEndsAt!));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [product.auctionEndsAt]);

  return (
    <Card
      data-product-id={product.id}
      className="hover:border-violet-400/50 flex h-full flex-col gap-0 overflow-hidden border-violet-200/40 py-0 transition-all hover:shadow-lg"
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
          {firstImage ? (
            <ProductImage
              src={firstImage}
              alt={product.title}
              className="absolute inset-0"
              imageClassName="transition-transform duration-300 group-hover:scale-105 border-3 border-card rounded-sm"
            />
          ) : (
            <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
              بدون تصویر
            </div>
          )}
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            {product.status === 'DEPRECATED' && (
              <Badge className="bg-red-600 text-white hover:bg-red-600">منقضی شده</Badge>
            )}
            <Badge className="bg-violet-600 text-white hover:bg-violet-600">
              <Gavel className="h-3 w-3" />
              مزایده
            </Badge>
          </div>
        </div>
        <CardContent className="space-y-2 p-3">
          <h3 className="line-clamp-2 min-h-10 text-sm leading-snug font-semibold">
            {product.title}
          </h3>
          <p className="text-foreground text-sm font-bold">
            {formatPrice(currentPrice)} <span className="text-xs font-normal">تومان</span>
          </p>
          <div className="text-muted-foreground flex flex-col gap-1.5 text-xs">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5 shrink-0" />
              {product.bidCount ?? 0} پیشنهاد
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              {countdown || '—'}
            </span>
            {(product.city || product.neighborhood) && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {formatProductLocation(product.city, product.neighborhood)}
              </span>
            )}
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
