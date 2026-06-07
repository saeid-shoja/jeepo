'use client';

import { Gavel, Plus } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AuctionProductCard } from '@/components/auction/auction-product-card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useAuth } from '@/stores/auth-store';

export function AuctionsPageClient() {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.products
      .list({ auctionActive: 'true', limit: '48' })
      .then((res) => setProducts(res.products))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 py-6 container">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Gavel className="text-violet-600 size-7" />
            مزایده‌ها
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            پیشنهاد ثبت کنید یا با قیمت خرید فوری مستقیم به سبد اضافه کنید
          </p>
        </div>
        {user && (
          <Button asChild>
            <Link href="/products/new" className="gap-2">
              <Plus className="size-4" />
              ثبت مزایده جدید
            </Link>
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-muted-foreground py-16 text-center">در حال بارگذاری...</p>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <AuctionProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <Gavel className="text-muted-foreground mx-auto mb-3 size-10" />
          <p className="text-muted-foreground">مزایده فعالی وجود ندارد</p>
          {user && (
            <Button className="mt-4" asChild variant="outline">
              <Link href="/products/new">ثبت اولین مزایده</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
