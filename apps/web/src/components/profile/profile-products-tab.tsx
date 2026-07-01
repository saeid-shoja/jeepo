'use client';

import {
  EXTRA_LISTING_FEE,
  FREE_CLIENT_LISTING_LIMIT,
  LISTING_PAYMENT_GRACE_DAYS,
} from '@offroad/shared';
import { CreditCard, PackageSearch, RefreshCw, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ListingPremiumPaymentDialog } from '@/components/form/premium-listing-payment-dialog';
import { DeleteListingDialog } from '@/components/profile/delete-listing-dialog';
import { ProductListingPremiumActions } from '@/components/profile/product-listing-premium-actions';
import { ProductCard } from '@/components/shop/product-card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

type ProfileProductsTabProps = {
  enabled: boolean;
  onListingsChanged?: () => void;
};

type PendingPaymentState = {
  productId: string;
  listingFee: number;
  paymentDueAt: string | null;
};

type PendingDeleteState = {
  productId: string;
  title: string;
};

export function ProfileProductsTab({ enabled, onListingsChanged }: ProfileProductsTabProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reactivatingId, setReactivatingId] = useState<string | null>(null);
  const [payingListingId, setPayingListingId] = useState<string | null>(null);
  const [pendingPayment, setPendingPayment] = useState<PendingPaymentState | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [listingFreeLimit, setListingFreeLimit] = useState(FREE_CLIENT_LISTING_LIMIT);
  const [activeListingsCount, setActiveListingsCount] = useState(0);
  const [pendingDelete, setPendingDelete] = useState<PendingDeleteState | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadProducts = useCallback(() => {
    setLoading(true);
    return api.users
      .products()
      .then((items) => {
        setProducts(items);
        onListingsChanged?.();
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [onListingsChanged]);

  const refreshListingQuota = useCallback(() => {
    return api.products
      .listingQuota()
      .then((quota) => {
        setListingFreeLimit(quota.freeLimit);
        setActiveListingsCount(quota.activeCount);
      })
      .catch(() => setListingFreeLimit(FREE_CLIENT_LISTING_LIMIT));
  }, []);

  useEffect(() => {
    if (enabled) {
      void loadProducts();
      void refreshListingQuota();
    }
  }, [enabled, loadProducts, refreshListingQuota]);

  const handlePayListingFee = async (productId: string) => {
    setPayingListingId(productId);
    setPaymentLoading(true);
    try {
      const res = await api.products.payListingFee(productId);
      if (res.requiresAdminApproval) {
        toast.success('پرداخت انجام شد. آگهی پس از بررسی قیمت توسط مدیر منتشر می‌شود.');
      } else {
        toast.success('پرداخت انجام شد و آگهی منتشر شد');
      }
      setPendingPayment(null);
      await Promise.all([loadProducts(), refreshListingQuota()]);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'پرداخت ناموفق بود');
    } finally {
      setPayingListingId(null);
      setPaymentLoading(false);
    }
  };

  const handleReactivate = async (productId: string) => {
    setReactivatingId(productId);
    try {
      const result = await api.products.reactivate(productId);
      if (result.requiresListingFee) {
        setPendingPayment({
          productId: result.product.id,
          listingFee: result.listingFee,
          paymentDueAt: result.paymentDueAt,
        });
        if (result.freeLimit) setListingFreeLimit(result.freeLimit);
        if (result.activeCount != null) setActiveListingsCount(result.activeCount);
        toast.info(
          `شما ${(result.activeCount ?? activeListingsCount).toLocaleString('fa-IR')} آگهی فعال دارید (سقف رایگان: ${(result.freeLimit ?? listingFreeLimit).toLocaleString('fa-IR')}). برای فعال‌سازی مجدد باید هزینه ثبت آگهی را بپردازید.`,
        );
        await Promise.all([loadProducts(), refreshListingQuota()]);
        return;
      }
      toast.success('آگهی با موفقیت فعال شد');
      await Promise.all([loadProducts(), refreshListingQuota()]);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'فعال‌سازی آگهی ناموفق بود');
    } finally {
      setReactivatingId(null);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await api.products.delete(pendingDelete.productId);
      toast.success('آگهی حذف شد');
      setPendingDelete(null);
      await Promise.all([loadProducts(), refreshListingQuota()]);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'حذف آگهی ناموفق بود');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="py-16 text-center text-gray-500">در حال بارگذاری...</div>;
  }

  if (products.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-300 py-16 text-center">
        <PackageSearch className="mx-auto h-12 w-12 text-gray-300" />
        <p className="mt-4 text-gray-500">هنوز آگهی ثبت نکرده‌اید</p>
        <Link
          href="/products/new"
          className="mt-4 inline-block rounded-sm bg-primary px-6 py-2 text-sm text-white hover:bg-primary-dark"
        >
          ثبت اولین آگهی
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product: any) => (
          <div key={product.id} className="flex flex-col gap-2">
            <ProductCard product={product} />
            {product.awaitingAdminApproval && (
              <div className="space-y-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-2 dark:border-blue-900 dark:bg-blue-950/30">
                <p className="text-center text-[11px] font-medium text-blue-800 dark:text-blue-200">
                  در انتظار تأیید مدیر
                </p>
                <p className="text-muted-foreground text-center text-[10px]">
                  پس از بررسی قیمت، آگهی در سایت نمایش داده می‌شود.
                </p>
              </div>
            )}
            {product.awaitingListingPayment && (
              <div className="space-y-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-2 dark:border-amber-900 dark:bg-amber-950/30">
                <p className="text-center text-[11px] font-medium text-amber-800 dark:text-amber-200">
                  در انتظار پرداخت
                </p>
                {product.listingPaymentDueAt && (
                  <p className="text-muted-foreground text-center text-[10px]">
                    مهلت: {new Date(product.listingPaymentDueAt).toLocaleDateString('fa-IR')}
                  </p>
                )}
                <Button
                  size="sm"
                  className="w-full gap-1"
                  disabled={payingListingId === product.id}
                  onClick={() =>
                    setPendingPayment({
                      productId: product.id,
                      listingFee: EXTRA_LISTING_FEE,
                      paymentDueAt: product.listingPaymentDueAt ?? null,
                    })
                  }
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  پرداخت و انتشار
                </Button>
              </div>
            )}
            <ProductListingPremiumActions product={product} onUpdated={loadProducts} />
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-full gap-1 text-destructive hover:bg-destructive/5 hover:text-destructive"
              disabled={deleting && pendingDelete?.productId === product.id}
              onClick={() => setPendingDelete({ productId: product.id, title: product.title })}
            >
              <Trash2
                className={`h-3.5 w-3.5 ${deleting && pendingDelete?.productId === product.id ? 'animate-pulse' : ''}`}
              />
              حذف آگهی
            </Button>
            {product.status === 'DEPRECATED' && (
              <div className="space-y-1 px-1">
                {product.deletionAt && (
                  <p className="text-muted-foreground text-center text-[10px]">
                    حذف خودکار: {new Date(product.deletionAt).toLocaleDateString('fa-IR')}
                  </p>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full gap-1"
                  disabled={reactivatingId === product.id}
                  onClick={() => handleReactivate(product.id)}
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${reactivatingId === product.id ? 'animate-spin' : ''}`}
                  />
                  فعال‌سازی مجدد
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      <DeleteListingDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && !deleting && setPendingDelete(null)}
        listingTitle={pendingDelete?.title ?? ''}
        loading={deleting}
        onConfirm={handleDelete}
      />

      <ListingPremiumPaymentDialog
        open={pendingPayment !== null}
        onOpenChange={(open) => !open && !paymentLoading && setPendingPayment(null)}
        loading={paymentLoading}
        title="پرداخت هزینه ثبت آگهی"
        description={`شما ${activeListingsCount.toLocaleString('fa-IR')} آگهی فعال دارید و سقف رایگان ${listingFreeLimit.toLocaleString('fa-IR')} است. برای انتشار این آگهی باید هزینه ثبت بپردازید.${
          pendingPayment?.paymentDueAt
            ? ` تا ${new Date(pendingPayment.paymentDueAt).toLocaleDateString('fa-IR')} (${LISTING_PAYMENT_GRACE_DAYS} روز) فرصت دارید.`
            : ''
        }`}
        fee={pendingPayment?.listingFee ?? EXTRA_LISTING_FEE}
        onConfirm={() => {
          if (pendingPayment) void handlePayListingFee(pendingPayment.productId);
        }}
      />
    </>
  );
}
