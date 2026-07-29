'use client';

import {
  formatAuctionCountdown,
  formatBidIncrementRate,
  formatPrice,
  getMinimumNextBid,
} from '@offroad/shared';
import { AlertTriangle, Clock, Gavel, TrendingUp, Users, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { BidDialog } from '@/components/auction/bid-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { getBuyNowPrice, isPurchasable } from '@/lib/purchasable';
import { useAuth } from '@/stores/auth-store';
import { useCart } from '@/stores/cart-store';

type AuctionPanelProps = {
  product: {
    id: string;
    title: string;
    images?: string[];
    isAuction: boolean;
    auctionStartPrice?: number;
    auctionCurrentPrice?: number;
    price: number;
    buyNowPrice?: number | null;
    realPriceMin?: number | null;
    realPriceMax?: number | null;
    auctionEndsAt?: string | null;
    auctionActive?: boolean;
    bidCount?: number;
  };
};

export function AuctionPanel({ product }: AuctionPanelProps) {
  const { user } = useAuth();
  const { addItem } = useCart();
  const router = useRouter();

  const [summary, setSummary] = useState<any>(null);
  const [countdown, setCountdown] = useState('');
  const [bidOpen, setBidOpen] = useState(false);
  const [outbidNotice, setOutbidNotice] = useState(false);
  const [endedNotice, setEndedNotice] = useState(false);

  const loadSummary = useCallback(() => {
    api.auctions
      .summary(product.id)
      .then(setSummary)
      .catch(() => setSummary(null));
  }, [product.id]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    if (!product.auctionEndsAt) return;
    const tick = () => {
      setCountdown(formatAuctionCountdown(product.auctionEndsAt!));
      const expired = new Date(product.auctionEndsAt!).getTime() <= Date.now();
      if (expired && summary?.userHighestBid) {
        setEndedNotice(true);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [product.auctionEndsAt, summary?.userHighestBid]);

  useEffect(() => {
    if (summary?.userWasOutbid) setOutbidNotice(true);
  }, [summary?.userWasOutbid]);

  const currentPrice = summary?.currentPrice ?? product.auctionCurrentPrice ?? product.price;
  const minNextBid = summary?.minNextBid ?? getMinimumNextBid(currentPrice);
  const bidCount = summary?.bidCount ?? product.bidCount ?? 0;
  const active = summary?.active ?? product.auctionActive;
  const canBuyNow = isPurchasable(product);
  const userIsTopBidder = summary?.userIsTopBidder === true;
  const canPlaceBid = active && !userIsTopBidder;

  const openBidFlow = () => {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(`/product/${product.id}`)}`);
      return;
    }
    setBidOpen(true);
  };

  const handleBuyNow = () => {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(`/product/${product.id}`)}`);
      return;
    }
    const price = getBuyNowPrice(product);
    addItem({
      productId: product.id,
      title: product.title,
      price,
      image: product.images?.[0] ?? null,
      quantity: 1,
    });
    router.push('/cart');
  };

  if (!product.isAuction) return null;

  return (
    <div className="space-y-4">
      <Card className="border-violet-300/50 bg-violet-50/30 dark:bg-violet-950/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gavel className="text-violet-600 size-5" />
            مزایده
            <Badge className="bg-violet-600 text-white hover:bg-violet-600">مزایده</Badge>
            {!active && <Badge variant="secondary">پایان یافته</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {userIsTopBidder && active && (
            <div className="flex items-start gap-2 rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-900 dark:bg-green-950/40 dark:text-green-100">
              <Gavel className="mt-0.5 size-4 shrink-0" />
              <p>
                شما بالاترین پیشنهاد ({formatPrice(currentPrice)} تومان) را دارید. تا زمانی که
                پیشنهاد بالاتری ثبت نشود، امکان ثبت پیشنهاد جدید ندارید.
              </p>
            </div>
          )}

          {outbidNotice && active && !userIsTopBidder && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <p>
                پیشنهاد بالاتری ثبت شده است. برای ادامه، پیشنهاد جدیدی بالاتر از{' '}
                <strong>{formatPrice(currentPrice)}</strong> تومان ثبت کنید.
              </p>
            </div>
          )}

          {endedNotice && !active && summary?.userHighestBid && (
            <div className="flex items-start gap-2 rounded-lg border border-blue-300 bg-blue-50 p-3 text-sm text-blue-900 dark:bg-blue-950/40">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <p>
                مزایده به پایان رسید. آخرین پیشنهاد شما{' '}
                <strong>{formatPrice(summary.userHighestBid)}</strong> تومان بود. پیشنهاد بالاتری
                برنده شده است.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-background rounded-lg border p-3">
              <p className="text-muted-foreground flex items-center gap-1 text-xs">
                <TrendingUp className="size-3.5" />
                قیمت فعلی
              </p>
              <p className="text-primary mt-1 text-xl font-bold">
                {formatPrice(currentPrice)}{' '}
                <span className="text-muted-foreground text-xs font-normal">تومان</span>
              </p>
            </div>
            <div className="bg-background rounded-lg border p-3">
              <p className="text-muted-foreground flex items-center gap-1 text-xs">
                <Users className="size-3.5" />
                تعداد پیشنهاد
              </p>
              <p className="mt-1 text-xl font-bold">{bidCount.toLocaleString('fa-IR')}</p>
            </div>
            <div className="bg-background rounded-lg border p-3">
              <p className="text-muted-foreground flex items-center gap-1 text-xs">
                <Clock className="size-3.5" />
                زمان باقی‌مانده
              </p>
              <p className="mt-1 font-semibold">{countdown || '—'}</p>
            </div>
            <div className="bg-background rounded-lg border p-3">
              <p className="text-muted-foreground text-xs">بازه قیمت واقعی</p>
              <p className="mt-1 text-sm font-medium">
                {product.realPriceMin != null && product.realPriceMax != null
                  ? `${formatPrice(product.realPriceMin)} – ${formatPrice(product.realPriceMax)}`
                  : '—'}
              </p>
            </div>
          </div>

          {active && (
            <p className="text-muted-foreground text-xs">
              حداقل پیشنهاد بعدی:{' '}
              <strong className="text-foreground">{formatPrice(minNextBid)}</strong> تومان (افزایش
              حداقل {formatBidIncrementRate(currentPrice)})
            </p>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            {canPlaceBid && (
              <Button type="button" className="flex-1 gap-2" onClick={openBidFlow}>
                <Gavel className="size-4" />
                ثبت پیشنهاد جدید
              </Button>
            )}
            {canBuyNow && (
              <Button
                type="button"
                variant="secondary"
                className="flex-1 gap-2"
                onClick={handleBuyNow}
              >
                <Zap className="size-4" />
                خرید فوری ({formatPrice(getBuyNowPrice(product))})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <BidDialog
        open={bidOpen}
        onOpenChange={setBidOpen}
        productId={product.id}
        minNextBid={minNextBid}
        user={user}
        onSuccess={() => {
          setOutbidNotice(false);
          loadSummary();
        }}
      />
    </div>
  );
}
