'use client';

import { Heart } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ProductCard } from '@/components/shop/product-card';
import { api } from '@/lib/api';
import { useFavoritesStore } from '@/stores/favorites-store';

type ProfileFavoritesTabProps = {
  enabled: boolean;
};

export function ProfileFavoritesTab({ enabled }: ProfileFavoritesTabProps) {
  const favoriteIds = useFavoritesStore((s) => s.ids);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled) return;

    setLoading(true);
    api.users
      .favorites()
      .then(setProducts)
      .catch(() => {
        setProducts([]);
        toast.error('بارگذاری علاقه‌مندی‌ها ناموفق بود');
      })
      .finally(() => setLoading(false));
  }, [enabled]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {['a', 'b', 'c', 'd'].map((id) => (
          <div key={id} className="bg-muted aspect-4/5 animate-pulse rounded-sm" />
        ))}
      </div>
    );
  }

  const visibleProducts = products.filter((product) => favoriteIds[product.id]);

  if (visibleProducts.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-300 py-16 text-center">
        <Heart className="mx-auto h-12 w-12 text-gray-300" />
        <p className="mt-4 text-gray-500">هنوز محصولی به علاقه‌مندی‌ها اضافه نکرده‌اید</p>
        <Link
          href="/products"
          className="mt-4 inline-block rounded-sm bg-primary px-6 py-2 text-sm text-white hover:bg-primary-dark"
        >
          مشاهده فروشگاه
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {visibleProducts.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
