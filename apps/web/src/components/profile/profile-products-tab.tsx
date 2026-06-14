'use client';

import {
  EXTRA_LISTING_FEE,
  FREE_CLIENT_LISTING_LIMIT,
  LISTING_PAYMENT_GRACE_DAYS,
} from '@offroad/shared';
import { CreditCard, PackageSearch, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ListingPremiumPaymentDialog } from '@/components/form/premium-listing-payment-dialog';
import { ProductListingPremiumActions } from '@/components/profile/product-listing-premium-actions';
import { ProductCard } from '@/components/shop/product-card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

type ProfileProductsTabProps = {
  enabled: boolean;
};

type PendingPaymentState = {
  productId: string;
  listingFee: number;
  paymentDueAt: string | null;
};

export function ProfileProductsTab({ enabled }: ProfileProductsTabProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reactivatingId, setReactivatingId] = useState<string | null>(null);
  const [payingListingId, setPayingListingId] = useState<string | null>(null);
  const [pendingPayment, setPendingPayment] = useState<PendingPaymentState | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const loadProducts = useCallback(() => {
    setLoading(true);
    return api.users
      .products()
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (enabled) {
      void loadProducts();
    }
  }, [enabled, loadProducts]);

  const handlePayListingFee = async (productId: string) => {
    setPayingListingId(productId);
    setPaymentLoading(true);
    try {
      await api.products.payListingFee(productId);
      toast.success('پرداخت انجام شد و آگهی منتشر شد');
      setPendingPayment(null);
      await loadProducts();
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
        toast.info(
          `شما ${FREE_CLIENT_LISTING_LIMIT} آگهی فعال دارید. برای فعال‌سازی مجدد باید هزینه ثبت آگهی را بپردازید.`,
        );
        await loadProducts();
        return;
      }
      toast.success('آگهی با موفقیت فعال شد');
      await loadProducts();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'فعال‌سازی آگهی ناموفق بود');
    } finally {
      setReactivatingId(null);
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
            {product.awaitingListingPayment && (
              <div className="space-y-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-2 dark:border-amber-900 dark:bg-amber-950/30">
                <p className="text-center text-[11px] font-medium text-amber-800 dark:text-amber-200">
                  در انتظار پرداخت
                </p>
                {product.listingPaymentDueAt && (
                  <p className="text-muted-foreground text-center text-[10px]">
                    مهلت:{' '}
                    {new Date(product.listingPaymentDueAt).toLocaleDateString('fa-IR')}
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

      <ListingPremiumPaymentDialog
        open={pendingPayment !== null}
        onOpenChange={(open) => !open && !paymentLoading && setPendingPayment(null)}
        loading={paymentLoading}
        title="پرداخت هزینه ثبت آگهی"
        description={`بیش از ${FREE_CLIENT_LISTING_LIMIT} آگهی فعال دارید. برای انتشار این آگهی باید هزینه ثبت بپردازید.${
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
