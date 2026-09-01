'use client';

import {
  formatPrice,
  formatProductLocationWithProvince,
  formatSellerRatingLabel,
  getVehiclePaintConditionLabel,
  isProductColorSelectable,
  LISTING_INTENT_LABELS,
  parseProductColorIds,
  timeAgo,
} from '@offroad/shared';
import {
  ArrowRight,
  BadgeCheck,
  Edit3,
  Flag,
  MapPin,
  Package,
  Phone,
  Shield,
  Star,
  Trash2,
  TriangleAlert,
  UserRound,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AddToCartButton } from '@/components/cart/add-to-cart-button';
import { StartProductChatButton } from '@/components/chat/start-product-chat-button';
import { DeleteListingDialog } from '@/components/profile/delete-listing-dialog';
import { AdvertiserContactDialog } from '@/components/shop/advertiser-contact-dialog';
import { FavoriteButton } from '@/components/shop/favorite-button';
import { GuaranteeInfoDialog } from '@/components/shop/guarantee-info-dialog';
import { ProductColorSwatches } from '@/components/shop/product-color-swatches';
import { ProductGallery } from '@/components/shop/product-gallery';
import { ProductListingIntentBadge } from '@/components/shop/product-listing-intent-badge';
import { ProductPriceDisplay } from '@/components/shop/product-price-display';
import { ProductShareButton } from '@/components/shop/product-share-button';
import { ProductSituationBadge } from '@/components/shop/product-situation-badge';
import { RelatedProductsStrip } from '@/components/shop/related-products-strip';
import { ReportProductDialog } from '@/components/shop/report-product-dialog';
import { TransactionSafetyDialog } from '@/components/shop/transaction-safety-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { canStartProductChat, isClientProduct, isShopProduct } from '@/lib/product-advertiser';
import { getSituationLabel, resolveProductSituation } from '@/lib/product-utils';
import { canViewerPurchase } from '@/lib/purchasable';
import { cn } from '@/lib/utils';
import { useAuth } from '@/stores/auth-store';

type SpecItem = { label: string; value: string };

function SpecRow({ label, value }: SpecItem) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-3 border-b border-border/60 py-2.5 last:border-0 sm:grid-cols-[9rem_1fr]">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

export function ProductDetailClient() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [guaranteeOpen, setGuaranteeOpen] = useState(false);

  useEffect(() => {
    if (!id || authLoading) return;
    setLoading(true);
    api.products
      .get(id)
      .then(setProduct)
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id, authLoading]);

  useEffect(() => {
    if (product?.id) {
      setQuantity(1);
      setSelectedColor(null);
    }
  }, [product?.id]);

  const specs = useMemo((): SpecItem[] => {
    if (!product) return [];
    const situation = resolveProductSituation(product);
    const situationLabel = getSituationLabel(situation);
    const stockQuantity = product.stockQuantity ?? 1;
    const rows: SpecItem[] = [];

    if (situationLabel) rows.push({ label: 'وضعیت', value: situationLabel });
    if (product.category?.name) rows.push({ label: 'دسته‌بندی', value: product.category.name });

    const brands = (product.carBrands as { label?: string; value?: string }[] | undefined) ?? [];
    if (brands.length) {
      rows.push({
        label: 'نوع خودرو',
        value: brands
          .map((b) => b.label || b.value)
          .filter(Boolean)
          .join('، '),
      });
    }

    if (!product.isAuction) {
      rows.push({
        label: 'موجودی',
        value: stockQuantity > 0 ? `${stockQuantity.toLocaleString('fa-IR')} عدد` : 'ناموجود',
      });
    }

    if (product.listingIntent === 'BUYER') {
      rows.push({ label: 'نوع آگهی', value: LISTING_INTENT_LABELS.BUYER });
    }

    if (product.mileageKm != null) {
      rows.push({
        label: 'کارکرد',
        value: `${Number(product.mileageKm).toLocaleString('fa-IR')} کیلومتر`,
      });
    }

    if (product.paintCondition) {
      rows.push({
        label: 'وضعیت رنگ',
        value:
          getVehiclePaintConditionLabel(product.paintCondition) ?? String(product.paintCondition),
      });
    }

    if ((product.city || product.neighborhood) && !isShopProduct(product)) {
      rows.push({
        label: 'موقعیت',
        value: formatProductLocationWithProvince(product.city, product.neighborhood),
      });
    }

    if (product.hasGuarantee) {
      rows.push({ label: 'تضمین', value: 'با تضمین جیپو' });
    }

    return rows;
  }, [product]);

  if (loading) {
    return (
      <div className="container animate-pulse py-6">
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="aspect-square rounded-2xl bg-muted lg:col-span-5" />
          <div className="space-y-4 lg:col-span-4">
            <div className="h-8 w-3/4 rounded bg-muted" />
            <div className="h-40 rounded-2xl bg-muted" />
            <div className="h-28 rounded-2xl bg-muted" />
          </div>
          <div className="space-y-4 lg:col-span-3">
            <div className="h-36 rounded-2xl bg-muted" />
            <div className="h-48 rounded-2xl bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return <div className="text-muted-foreground py-16 text-center">محصول یافت نشد</div>;
  }

  const images = product.images || [];
  const isOwner = user?.id === product.userId;
  const situation = resolveProductSituation(product);
  const canBuy = canViewerPurchase(product, user?.id);
  const stockQuantity = product.stockQuantity ?? 1;
  const canChat = canStartProductChat(product, user?.id);
  const showSafetyWarning = isClientProduct(product);
  const isClient = isClientProduct(product);
  const colorIds: string[] = Array.isArray(product.colors)
    ? product.colors
    : parseProductColorIds(product.color);
  const colorSelectable = isProductColorSelectable(product) && canBuy && colorIds.length > 0;
  const sellerRating = product.user?.rating as number | null | undefined;
  const sellerVerified = Boolean(product.user?.verifiedSeller);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.products.delete(product.id ?? id);
      toast.success('آگهی حذف شد');
      setDeleteOpen(false);
      router.push('/dashboard');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'حذف آگهی ناموفق بود');
    } finally {
      setDeleting(false);
    }
  };

  const purchaseCard = !product.isAuction && canBuy && stockQuantity > 0 && (
    <Card className="gap-0 overflow-hidden rounded-2xl border-border/70 py-0 shadow-sm">
      <CardHeader className="border-b border-border/60 px-5 pt-4">
        <CardTitle className="text-base font-semibold">خرید محصول</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-5 py-5">
        <ProductPriceDisplay price={product.price} salePrice={product.salePrice} variant="detail" />
        {product.newPrice != null && product.newPrice > 0 && (
          <p className="text-muted-foreground text-sm">
            قیمت نو:{' '}
            <span className="text-muted-foreground font-medium">
              {formatPrice(product.newPrice)} تومان
            </span>
          </p>
        )}

        {colorIds.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">رنگ</p>
            <ProductColorSwatches
              colorIds={colorIds}
              selectable={colorSelectable}
              selectedId={colorSelectable ? selectedColor : null}
              onSelect={setSelectedColor}
              showLabels
            />
            {colorSelectable ? (
              <p className="text-muted-foreground text-xs leading-relaxed">
                یک رنگ را انتخاب کنید و به سبد اضافه کنید.
              </p>
            ) : null}
          </div>
        )}

        {stockQuantity > 1 ? (
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground text-sm">تعداد</span>
            <div className="flex items-center gap-1 rounded-xl border">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                −
              </Button>
              <span className="min-w-8 text-center text-sm font-medium">{quantity}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9"
                onClick={() => setQuantity((q) => Math.min(stockQuantity, q + 1))}
                disabled={quantity >= stockQuantity}
              >
                +
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">۱ عدد موجود برای خرید</p>
        )}

        <AddToCartButton
          product={product}
          quantity={quantity}
          maxQuantity={stockQuantity}
          color={selectedColor}
          requireColor={colorSelectable}
          className="w-full rounded-xl mb-2"
        />
        <Button variant="outline" className="w-full rounded-xl" asChild>
          <Link href="/cart">رفتن به سبد خرید</Link>
        </Button>
      </CardContent>
    </Card>
  );

  const priceOnlyCard = !product.isAuction && !(canBuy && stockQuantity > 0) && (
    <Card className="gap-0 overflow-hidden rounded-2xl border-border/70 py-0 shadow-sm">
      <CardContent className="space-y-2 px-5 py-5">
        <ProductPriceDisplay price={product.price} salePrice={product.salePrice} variant="detail" />
        {product.newPrice != null && product.newPrice > 0 && (
          <p className="text-muted-foreground text-sm">
            قیمت نو:{' '}
            <span className="text-muted-foreground font-medium">
              {formatPrice(product.newPrice)} تومان
            </span>
          </p>
        )}
        {colorIds.length > 0 && (
          <div className="space-y-2 pt-2">
            <p className="text-sm font-medium">رنگ</p>
            <ProductColorSwatches colorIds={colorIds} selectable={false} showLabels />
          </div>
        )}
      </CardContent>
    </Card>
  );

  const sellerCard = isClient && (
    <Card className="gap-0 overflow-hidden rounded-2xl border-border/70 py-0 shadow-sm">
      <CardHeader className="border-b border-border/60 px-5 py-4">
        <CardTitle className="text-base font-semibold">اطلاعات فروشنده</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-5 py-5">
        <div className="flex items-start gap-3">
          <div className="bg-muted text-muted-foreground flex size-11 shrink-0 items-center justify-center rounded-full">
            <UserRound className="size-5" />
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            {product.userId ? (
              <Link
                href={`/seller/${product.userId}`}
                className="hover:text-primary block truncate text-sm font-semibold transition-colors"
              >
                {'فروشنده'}
              </Link>
            ) : (
              <p className="truncate text-sm font-semibold">{'فروشنده'}</p>
            )}

            {product.userId ? (
              <Link
                href={`/seller/${product.userId}`}
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs transition-colors"
              >
                <Star className="size-3.5 fill-amber-500 text-amber-500" />
                {formatSellerRatingLabel(sellerRating)}
                {sellerVerified ? (
                  <BadgeCheck className="size-3.5 text-emerald-600" aria-label="احراز شده" />
                ) : null}
              </Link>
            ) : null}

            {(product.city || product.neighborhood) && (
              <p className="text-muted-foreground flex items-start gap-1 text-xs leading-relaxed">
                <MapPin className="mt-0.5 size-3.5 shrink-0" />
                {formatProductLocationWithProvince(product.city, product.neighborhood)}
              </p>
            )}
          </div>
        </div>

        {!product.isAuction && (
          <div className="grid gap-2">
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-xl"
              onClick={() => setContactOpen(true)}
            >
              <Phone className="size-4" />
              تماس با فروشنده
            </Button>
            {canChat && (
              <StartProductChatButton
                productId={product.id ?? id}
                className="w-full rounded-xl"
                label="گفتگو با فروشنده"
              />
            )}
          </div>
        )}

        {showSafetyWarning && (
          <button
            type="button"
            onClick={() => setSafetyOpen(true)}
            className="bg-amber-50 text-amber-900 hover:bg-amber-100 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-right text-xs transition-colors"
          >
            <TriangleAlert className="size-4 shrink-0" />
            نکات ایمنی معامله را بخوانید. با هیچ درخواست بیعانه ای موافقت نکنید. درخواست بیعانه از
            نشانه های بارز کلاهبرداری می باشد.
          </button>
        )}

        {!isOwner && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive h-auto px-0"
            onClick={() => setReportOpen(true)}
          >
            <Flag className="size-3.5" />
            گزارش تخلف
          </Button>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-10 pb-10">
      <div className="container">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-muted-foreground hover:text-foreground mb-5 inline-flex items-center gap-1 text-sm transition-colors"
        >
          <ArrowRight className="size-4" />
          بازگشت
        </button>

        <div className="grid items-start gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Gallery — right column in RTL */}
          <div className="min-w-0 lg:col-span-5">
            <ProductGallery
              images={images}
              title={product.title}
              resetKey={product.id ?? id}
              badge={
                <>
                  <ProductSituationBadge situation={situation} />
                  <ProductListingIntentBadge listingIntent={product.listingIntent} />
                </>
              }
            />
          </div>

          {/* Middle: title + specs + description */}
          <div className="min-w-0 space-y-5 lg:col-span-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-xl leading-snug font-bold sm:text-2xl">{product.title}</h1>
                <div className="flex shrink-0 items-center gap-0.5">
                  <FavoriteButton productId={product.id ?? id} isDetailPage />
                  <ProductShareButton productId={product.id ?? id} title={product.title} />
                  {isOwner && (
                    <>
                      <Link
                        href={`/products/${product.id}/edit`}
                        className="text-muted-foreground hover:bg-muted rounded-md p-2 transition-colors"
                        aria-label="ویرایش"
                      >
                        <Edit3 className="size-4" />
                      </Link>
                      <button
                        type="button"
                        className="text-destructive hover:bg-destructive/10 rounded-md p-2 transition-colors disabled:opacity-50"
                        disabled={deleting}
                        aria-label="حذف آگهی"
                        onClick={() => setDeleteOpen(true)}
                      >
                        <Trash2 className={cn('size-4', deleting && 'animate-pulse')} />
                      </button>
                    </>
                  )}
                </div>
              </div>
              {isClient && (
                <p className="text-muted-foreground text-sm">
                  {timeAgo(new Date(product.listedAt ?? product.createdAt))}
                </p>
              )}
              <div className="flex flex-wrap gap-1.5">
                <ProductSituationBadge situation={situation} />
                <ProductListingIntentBadge listingIntent={product.listingIntent} />
                {product.hasGuarantee && (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 transition-colors hover:bg-emerald-200"
                    onClick={() => setGuaranteeOpen(true)}
                  >
                    <Shield className="size-3" />
                    تضمین جیپو
                  </button>
                )}
              </div>
            </div>

            {/* Mobile: price / purchase before specs */}
            <div className="space-y-4 lg:hidden">
              {purchaseCard}
              {priceOnlyCard}
            </div>

            <Card className="gap-0 overflow-hidden rounded-2xl border-border/70 py-0 shadow-sm">
              <CardHeader className="border-b border-border/60 px-5 py-4">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Package className="text-muted-foreground size-4" />
                  ویژگی‌های محصول
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 py-2">
                {specs.length ? (
                  <dl>
                    {specs.map((item) => (
                      <SpecRow key={item.label} label={item.label} value={item.value} />
                    ))}
                  </dl>
                ) : (
                  <p className="text-muted-foreground py-4 text-sm">ویژگی ثبت نشده است.</p>
                )}
              </CardContent>
            </Card>

            <Card className="gap-0 overflow-hidden rounded-2xl border-border/70 py-0 shadow-sm">
              <CardHeader className="border-b border-border/60 px-5 py-4">
                <CardTitle className="text-base font-semibold">توضیحات</CardTitle>
              </CardHeader>
              <CardContent className="px-5 py-5">
                <p className="text-foreground/90 whitespace-pre-wrap text-sm leading-7">
                  {product.description}
                </p>
              </CardContent>
            </Card>

            {/* Mobile seller card */}
            <div className="lg:hidden">{sellerCard}</div>
          </div>

          {/* Left sidebar in RTL: price + seller */}
          <aside className="hidden space-y-4 lg:col-span-3 lg:block lg:sticky lg:top-20 lg:z-10">
            {purchaseCard}
            {priceOnlyCard}
            {sellerCard}

            {!isClient && product.hasGuarantee && (
              <button
                type="button"
                onClick={() => setGuaranteeOpen(true)}
                className="text-muted-foreground hover:text-foreground flex w-full items-center justify-center gap-1.5 text-xs transition-colors"
              >
                <Shield className="size-3.5" />
                اطلاعات تضمین جیپو
              </button>
            )}
          </aside>
        </div>
      </div>

      <RelatedProductsStrip productId={product.id ?? id} />

      <TransactionSafetyDialog open={safetyOpen} onOpenChange={setSafetyOpen} />
      <GuaranteeInfoDialog open={guaranteeOpen} onOpenChange={setGuaranteeOpen} />
      <AdvertiserContactDialog
        open={contactOpen}
        onOpenChange={setContactOpen}
        phone={product.phone}
        isAuthenticated={Boolean(user)}
      />
      <ReportProductDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        productId={product.id ?? id}
        productTitle={product.title}
        isAuthenticated={Boolean(user)}
      />
      <DeleteListingDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        listingTitle={product.title}
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
