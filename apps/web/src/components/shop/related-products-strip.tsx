'use client';

import { useEffect, useState } from 'react';
import { HomeProductStrip } from '@/components/home/home-product-strip';
import { ProductCard } from '@/components/shop/product-card';
import { api } from '@/lib/api';

type RelatedProductsStripProps = {
  productId: string;
};

export function RelatedProductsStrip({ productId }: RelatedProductsStripProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.products
      .related(productId)
      .then((res) => {
        if (!cancelled) setItems(res.products ?? []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  if (!loading && items.length === 0) return null;

  return (
    <div className="container">
      <div className="rounded-2xl border border-border/70 bg-card/70 p-4 shadow-sm sm:p-5">
        <h3 className="mb-2 text-base font-semibold sm:text-lg">محصولات مرتبط</h3>
        <HomeProductStrip
          loading={loading}
          items={items}
          emptyMessage=""
          getItemKey={(product) => product.id}
          renderItem={(product) => <ProductCard product={product} />}
        />
      </div>
    </div>
  );
}
