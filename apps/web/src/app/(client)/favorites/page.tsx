'use client';

import { Heart } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ProductCard } from '@/components/shop/product-card';
import { api } from '@/lib/api';
import { useAuth } from '@/stores/auth-store';
import { useFavoritesStore } from '@/stores/favorites-store';

export default function FavoritesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const favoriteIds = useFavoritesStore((s) => s.ids);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (!user) return;

    setLoading(true);
    api.users
      .favorites()
      .then(setProducts)
      .catch(() => {
        setProducts([]);
        toast.error('بارگذاری علاقه‌مندی‌ها ناموفق بود');
      })
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  if (authLoading || (!user && loading)) {
    return <div className="py-16 text-center text-gray-500">در حال بارگذاری...</div>;
  }

  if (!user) return null;

  const visibleProducts = products.filter((product) => favoriteIds[product.id]);

  return (
    <div className="container space-y-6">
      <div className="flex items-center gap-2">
        <Heart className="h-6 w-6 fill-red-500 text-red-500" />
        <h1 className="text-xl font-bold">علاقه‌مندی‌ها</h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-muted aspect-4/5 animate-pulse rounded-sm" />
          ))}
        </div>
      ) : visibleProducts.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {visibleProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
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
      )}
    </div>
  );
}
