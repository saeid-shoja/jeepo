'use client';

import {
  formatPrice,
  formatProductLocationWithProvince,
  getVehiclePaintConditionLabel,
  timeAgo,
} from '@offroad/shared';
import {
  ArrowRight,
  Edit3,
  Flag,
  Gauge,
  MapPin,
  Package,
  Phone,
  Shield,
  Trash2,
  TrendingUp,
  TriangleAlert,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AddToCartButton } from '@/components/cart/add-to-cart-button';
import { StartProductChatButton } from '@/components/chat/start-product-chat-button';
import { DeleteListingDialog } from '@/components/profile/delete-listing-dialog';
import { AdvertiserContactDialog } from '@/components/shop/advertiser-contact-dialog';
import { FavoriteButton } from '@/components/shop/favorite-button';
import { GuaranteeInfoDialog } from '@/components/shop/guarantee-info-dialog';
import { ProductGallery } from '@/components/shop/product-gallery';
import { ProductShareButton } from '@/components/shop/product-share-button';
import { ProductSituationBadge } from '@/components/shop/product-situation-badge';
import { ReportProductDialog } from '@/components/shop/report-product-dialog';
import { TransactionSafetyDialog } from '@/components/shop/transaction-safety-dialog';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { canStartProductChat, isClientProduct } from '@/lib/product-advertiser';
import { resolveProductSituation } from '@/lib/product-utils';
import { canViewerPurchase } from '@/lib/purchasable';
import { useAuth } from '@/stores/auth-store';

export function ProductDetailClient() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
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
    if (product?.id) setQuantity(1);
  }, [product?.id]);

  if (loading) {
    return (
      <div className="grid animate-pulse gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="aspect-square rounded-lg bg-muted" />
          <div className="flex gap-2">
            <div className="h-16 w-16 rounded-sm bg-muted" />
            <div className="h-16 w-16 rounded-sm bg-muted" />
            <div className="h-16 w-16 rounded-sm bg-muted" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-8 w-3/4 rounded bg-muted" />
          <div className="h-6 w-1/3 rounded bg-muted" />
          <div className="h-24 w-full rounded bg-muted" />
          <div className="h-10 w-1/2 rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (!product) {
    return <div className="py-16 text-center text-gray-500">محصول یافت نشد</div>;
  }

  const images = product.images || [];
  const isOwner = user?.id === product.userId;
  const situation = resolveProductSituation(product);
  const canBuy = canViewerPurchase(product, user?.id);
  const stockQuantity = product.stockQuantity ?? 1;
  const showStock = !product.isAuction;
  const canChat = canStartProductChat(product, user?.id);
  const showSafetyWarning = isClientProduct(product);

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

  return (
    <div className="grid gap-8 lg:grid-cols-2 container">
      <ProductGallery
        images={images}
        title={product.title}
        resetKey={product.id ?? id}
        badge={<ProductSituationBadge situation={situation} />}
      />

      <div className="space-y-5">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-2xl font-bold">{product.title}</h1>
            <div className="flex shrink-0 items-center gap-1">
              <FavoriteButton productId={product.id ?? id} />
              <ProductShareButton productId={product.id ?? id} title={product.title} />
              {isOwner && (
                <>
                  <Link
                    href={`/products/${product.id}/edit`}
                    className="rounded-sm p-1 text-gray-500 hover:bg-gray-100 mt-1"
                  >
                    <Edit3 className="h-5 w-4" />
                  </Link>
                  <button
                    type="button"
                    className="rounded-sm p-2 text-red-500 hover:bg-red-50 disabled:opacity-50"
                    disabled={deleting}
                    aria-label="حذف آگهی"
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 className={`h-4 w-4 ${deleting ? 'animate-pulse' : ''}`} />
                  </button>
                </>
              )}
            </div>
          </div>
          <p className="mt-1 text-sm text-gray-400">
            {timeAgo(new Date(product.createdAt))} در {product.category?.name}
          </p>
        </div>

        {!product.isAuction && (
          <div className="space-y-1">
            <p className="text-3xl font-bold text-primary">
              {formatPrice(product.price)} <span className="text-lg">تومان</span>
            </p>
            {product.newPrice != null && product.newPrice > 0 && (
              <p className="text-sm text-muted-foreground">
                قیمت نو محصول:{' '}
                <span className="font-medium text-foreground">
                  {formatPrice(product.newPrice)} تومان
                </span>
              </p>
            )}
            {(product.mileageKm != null || product.paintCondition || product.color) && (
              <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {product.color && (
                  <span>
                    رنگ:{' '}
                    <span className="text-foreground font-medium">{product.color}</span>
                  </span>
                )}
                {product.mileageKm != null && (
                  <span className="inline-flex items-center gap-1">
                    <Gauge className="h-4 w-4 shrink-0" aria-hidden />
                    کارکرد: {Number(product.mileageKm).toLocaleString('fa-IR')} کیلومتر
                  </span>
                )}
                {product.paintCondition && (
                  <span>
                    وضعیت رنگ:{' '}
                    <span className="text-foreground font-medium">
                      {getVehiclePaintConditionLabel(product.paintCondition) ??
                        product.paintCondition}
                    </span>
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <ProductSituationBadge situation={situation} />
          {product.carBrands?.map((b: { value: string; label: string }) => (
            <span
              key={b.value}
              className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700"
            >
              {b.label}
            </span>
          ))}
          {/* {product.hasGuarantee && (
            <button
              type="button"
              className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm text-green-700 transition-colors hover:bg-green-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600/40"
              aria-label="اطلاعات تضمین فروشگاه"
              onClick={() => setGuaranteeOpen(true)}
            >
              <Shield className="h-4 w-4" />
              با تضمین فروشگاه
            </button>
          )} */}
          {/* مزایده — موقتاً غیرفعال
          {product.isAuction && (
            <Badge className="bg-violet-600 text-white hover:bg-violet-600">مزایده</Badge>
          )}
          */}
          {/* تقویت شده — موقتاً غیرفعال
          {product.isStrengthenedActive && (
            <span className="flex items-center gap-1 rounded-full bg-violet-100 px-3 py-1 text-sm text-violet-700">
              <Sparkles className="h-4 w-4" />
              تقویت شده
            </span>
          )}
          */}
          {product.isBoosted && (
            <span className="flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-sm text-amber-700">
              <TrendingUp className="h-4 w-4" />
              پله شده
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-start gap-x-4 gap-y-2 text-sm text-gray-400 sm:items-center">
          {(product.city || product.neighborhood) && (
            <span className="inline-flex min-w-0 max-w-full items-start gap-1 sm:items-center">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 sm:mt-0" aria-hidden />
              <span className="wrap-break leading-relaxed">
                {formatProductLocationWithProvince(product.city, product.neighborhood)}
              </span>
            </span>
          )}
          {showStock && (
            <span className="flex items-center gap-1">
              <Package className="h-4 w-4" />
              {stockQuantity > 0 ? `${stockQuantity.toLocaleString('fa-IR')} عدد موجود` : 'ناموجود'}
            </span>
          )}
          {showSafetyWarning && (
            <Button
              size={'sm'}
              onClick={() => setSafetyOpen(true)}
              className="gap-1 rounded-lg cursor-pointer"
              title="ریسک معامله"
            >
              <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden />
              <span className="whitespace-nowrap">خطر معامله</span>
            </Button>
          )}
        </div>

        <TransactionSafetyDialog open={safetyOpen} onOpenChange={setSafetyOpen} />
        <GuaranteeInfoDialog open={guaranteeOpen} onOpenChange={setGuaranteeOpen} />

        <div>
          <h3 className="mb-2 font-bold">توضیحات</h3>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-400">
            {product.description}
          </p>
        </div>

        {/* مزایده — موقتاً غیرفعال
        {product.isAuction && <AuctionPanel product={product} />}
        */}

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

        {isClientProduct(product) && !product.isAuction && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setContactOpen(true)}
            >
              <Phone className="h-4 w-4" />
              تماس
            </Button>
            {canChat && (
              <StartProductChatButton productId={product.id ?? id} className="flex-1" label="چت" />
            )}
            <AdvertiserContactDialog
              open={contactOpen}
              onOpenChange={setContactOpen}
              phone={product.phone}
              isAuthenticated={Boolean(user)}
            />
          </div>
        )}

        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-gray-300 hover:text-primary"
        >
          <ArrowRight className="h-4 w-4" />
          بازگشت به لیست
        </button>

        {!isOwner && (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-destructive border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
              onClick={() => setReportOpen(true)}
            >
              <Flag className="size-4" />
              گزارش تخلف
            </Button>
            <ReportProductDialog
              open={reportOpen}
              onOpenChange={setReportOpen}
              productId={product.id ?? id}
              productTitle={product.title}
              isAuthenticated={Boolean(user)}
            />
          </>
        )}
      </div>

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
