'use client';

import { PackageSearch, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ProductCard } from '@/components/shop/product-card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

type ProfileProductsTabProps = {
  enabled: boolean;
};

export function ProfileProductsTab({ enabled }: ProfileProductsTabProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reactivatingId, setReactivatingId] = useState<string | null>(null);

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

  const handleReactivate = async (productId: string) => {
    setReactivatingId(productId);
    try {
      await api.products.reactivate(productId);
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
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product: any) => (
        <div key={product.id} className="flex flex-col gap-2">
          <ProductCard product={product} />
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
  );
}
