'use client';

import { formatPrice, timeAgo } from '@offroad/shared';
import {
  ArrowRight,
  Edit3,
  MapPin,
  Package,
  Phone,
  Shield,
  Sparkles,
  Trash2,
  TrendingUp,
  User,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AuctionPanel } from '@/components/auction/auction-panel';
import { AddToCartButton } from '@/components/cart/add-to-cart-button';
import { AdvertiserContactDialog } from '@/components/shop/advertiser-contact-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { getSituationLabel } from '@/lib/product-utils';
import { isPurchasable } from '@/lib/purchasable';
import { useAuth } from '@/stores/auth-store';

export function ProductDetailClient() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [contactOpen, setContactOpen] = useState(false);

  useEffect(() => {
    if (!id || authLoading) return;
    setLoading(true);
    api.products
      .get(id)
      .then(setProduct)
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id, authLoading, user?.id]);

  useEffect(() => {
    if (product?.id) setQuantity(1);
  }, [product?.id]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="aspect-video rounded-lg bg-gray-200" />
        <div className="h-8 w-1/2 rounded bg-gray-200" />
        <div className="h-6 w-1/4 rounded bg-gray-200" />
      </div>
    );
  }

  if (!product) {
    return <div className="py-16 text-center text-gray-500">محصول یافت نشد</div>;
  }

  const images = product.images || [];
  const isOwner = user?.id === product.userId;
  const situationLabel = getSituationLabel(
    product.situation ?? (product.type === 'SHOP' ? 'IN_STOCK' : null),
  );
  const canBuy = isPurchasable(product);
  const stockQuantity = product.stockQuantity ?? 1;
  const showStock = !product.isAuction;

  return (
    <div className="grid gap-8 lg:grid-cols-2 container">
      <div className="space-y-3">
        <div className="overflow-hidden rounded-lg bg-gray-100">
          {images[currentImage] ? (
            <Image
              width={100}
              height={100}
              src={images[currentImage]}
              alt={product.title}
              className="h-auto w-full object-cover"
            />
          ) : (
            <div className="flex aspect-square items-center justify-center text-gray-400">
              بدون تصویر
            </div>
          )}
        </div>
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto">
            {images.map((img: string, i: number) => (
              <Button
                key={img}
                onClick={() => setCurrentImage(i)}
                className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-sm border-2 ${currentImage === i ? 'border-primary' : 'border-transparent'}`}
              >
                <Image
                  width={100}
                  height={100}
                  src={img}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </Button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-5">
        <div>
          <div className="flex items-start justify-between">
            <h1 className="text-2xl font-bold">{product.title}</h1>
            {isOwner && (
              <div className="flex gap-2">
                <Link
                  href={`/products/${product.id}/edit`}
                  className="rounded-sm p-2 text-gray-500 hover:bg-gray-100"
                >
                  <Edit3 className="h-4 w-4" />
                </Link>
                <button type="button" className="rounded-sm p-2 text-red-500 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-400">
            {timeAgo(new Date(product.createdAt))} در {product.category?.name}
          </p>
        </div>

        {!product.isAuction && (
          <p className="text-3xl font-bold text-primary">
            {formatPrice(product.price)} <span className="text-lg">تومان</span>
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {situationLabel && (
            <Badge
              className={
                product.situation === 'IN_STOCK' || product.type === 'SHOP'
                  ? 'bg-emerald-600 text-white hover:bg-emerald-600'
                  : product.situation === 'USED'
                    ? 'bg-amber-600 text-white hover:bg-amber-600'
                    : 'bg-sky-600 text-white hover:bg-sky-600'
              }
            >
              {product.situation === 'IN_STOCK' ||
              product.type === 'SHOP' ||
              product.situation === 'USED' ? (
                <Package className="h-3 w-3" />
              ) : (
                <Sparkles className="h-3 w-3" />
              )}
              {situationLabel}
            </Badge>
          )}
          {product.carBrands?.map((b: { value: string; label: string }) => (
            <span
              key={b.value}
              className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700"
            >
              {b.label}
            </span>
          ))}
          {product.hasGuarantee && (
            <span className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm text-green-700">
              <Shield className="h-4 w-4" />
              با تضمین فروشگاه
            </span>
          )}
          {product.isAuction && (
            <Badge className="bg-violet-600 text-white hover:bg-violet-600">مزایده</Badge>
          )}
          {product.isStrengthenedActive && (
            <span className="flex items-center gap-1 rounded-full bg-violet-100 px-3 py-1 text-sm text-violet-700">
              <Sparkles className="h-4 w-4" />
              تقویت شده
            </span>
          )}
          {product.isBoosted && (
            <span className="flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-sm text-amber-700">
              <TrendingUp className="h-4 w-4" />
              پله شده
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-400">
          {product.city && (
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {product.city}
            </span>
          )}
          {showStock && (
            <span className="flex items-center gap-1">
              <Package className="h-4 w-4" />
              {stockQuantity > 0 ? `${stockQuantity.toLocaleString('fa-IR')} عدد موجود` : 'ناموجود'}
            </span>
          )}
        </div>

        <div>
          <h3 className="mb-2 font-bold">توضیحات</h3>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-400">
            {product.description}
          </p>
        </div>

        {product.isAuction && <AuctionPanel product={product} />}

        {canBuy && !product.isAuction && stockQuantity > 0 && (
          <div className="rounded-lg border bg-card p-4 space-y-4">
            <h3 className="font-bold">خرید از فروشگاه</h3>
            {stockQuantity > 1 ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">تعداد:</span>
                <div className="flex items-center gap-2 rounded-lg border">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  >
                    −
                  </Button>
                  <span className="min-w-8 text-center font-medium">{quantity}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => setQuantity((q) => Math.min(stockQuantity, q + 1))}
                    disabled={quantity >= stockQuantity}
                  >
                    +
                  </Button>
                </div>
                <span className="text-muted-foreground text-xs">
                  حداکثر {stockQuantity.toLocaleString('fa-IR')} عدد
                </span>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">۱ عدد موجود برای خرید</p>
            )}
            <AddToCartButton
              product={product}
              quantity={quantity}
              maxQuantity={stockQuantity}
              className="w-full"
            />
            <Button variant="outline" className="w-full" asChild>
              <Link href="/cart">رفتن به سبد خرید</Link>
            </Button>
          </div>
        )}

        {product.type === 'CLIENT' && product.user && !product.isAuction && (
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <User className="h-5 w-5" />
                </div>
                <p className="font-medium">{product.user.name || 'کاربر'}</p>
              </div>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="shrink-0 rounded-full"
                aria-label="مشاهده شماره تماس آگهی‌دهنده"
                onClick={() => setContactOpen(true)}
              >
                <Phone className="h-4 w-4" />
              </Button>
            </div>
            <AdvertiserContactDialog
              open={contactOpen}
              onOpenChange={setContactOpen}
              phone={product.phone}
              isAuthenticated={Boolean(user)}
            />
          </div>
        )}

        <Link
          href="/products"
          className="flex items-center gap-1 text-sm text-gray-300 hover:text-primary"
        >
          <ArrowRight className="h-4 w-4" />
          بازگشت به لیست
        </Link>
      </div>
    </div>
  );
}
