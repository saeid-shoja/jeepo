'use client';

import { ArrowLeft, Store } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { HomeProductStrip } from '@/components/home/home-product-strip';
import { ProductCard } from '@/components/shop/product-card';
import { api } from '@/lib/api';

const HOME_SECTION_LIMIT = '15';

export default function MainSection() {
  const [shopProducts, setShopProducts] = useState<any[]>([]);
  const [shopLoading, setShopLoading] = useState(true);

  useEffect(() => {
    setShopLoading(true);
    api.products
      .list({ advertiser: 'SHOP', limit: HOME_SECTION_LIMIT })
      .then((res) => setShopProducts(res.products))
      .catch(() => setShopProducts([]))
      .finally(() => setShopLoading(false));
  }, []);

  return (
    <section className="bg-border/30 -mx-4 px-4 py-5">
      <div className="container mb-5 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <Store className="text-primary h-6 w-6" />
          محصولات فروشگاه
        </h2>
        <Link
          href="/products"
          className="text-primary flex items-center gap-1 text-sm hover:underline"
        >
          مشاهده همه <ArrowLeft className="h-4 w-4" />
        </Link>
      </div>
      <div className="container">
        <HomeProductStrip
          loading={shopLoading}
          items={shopProducts}
          emptyMessage="به زودی محصولات جدید اضافه می‌شود"
          getItemKey={(product) => product.id}
          renderItem={(product) => <ProductCard product={product} />}
        />
      </div>
    </section>
  );
}
