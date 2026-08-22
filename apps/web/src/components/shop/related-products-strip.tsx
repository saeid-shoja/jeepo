'use client';

import { useEffect, useState } from 'react';
import { HomeProductStrip } from '@/components/home/home-product-strip';
import { ProductCard } from '@/components/shop/product-card';
import { api } from '@/lib/api';

type RelatedProductsStripProps = {
  productId: string;
};

function scheduleAfterPaint(cb: () => void): () => void {
  if (typeof window === 'undefined') {
    cb();
    return () => {};
  }
  const w = window as Window & {
    requestIdleCallback?: (fn: () => void, opts?: { timeout: number }) => number;
    cancelIdleCallback?: (id: number) => void;
  };
  if (typeof w.requestIdleCallback === 'function') {
    const id = w.requestIdleCallback(cb, { timeout: 1800 });
    return () => w.cancelIdleCallback?.(id);
  }
  const id = window.setTimeout(cb, 400);
  return () => window.clearTimeout(id);
}

function isAbortError(err: unknown) {
  return err instanceof Error && err.name === 'AbortError';
}

export function RelatedProductsStrip({ productId }: RelatedProductsStripProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    setStarted(false);
    setLoading(true);
    setItems([]);
    return scheduleAfterPaint(() => setStarted(true));
  }, [productId]);

  useEffect(() => {
    if (!started) return;

    const controller = new AbortController();
    setLoading(true);

    api.products
      .related(productId, { signal: controller.signal })
      .then((res) => {
        if (!controller.signal.aborted) setItems(res.products ?? []);
      })
      .catch((err) => {
        if (isAbortError(err) || controller.signal.aborted) return;
        setItems([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [productId, started]);

  if (!loading && items.length === 0) return null;

  return (
    <div className="container">
      <div className="rounded-2xl border border-border/70 bg-card/70 p-4 shadow-sm sm:p-5">
        <h3 className="mb-2 text-base font-semibold sm:text-lg">محصولات مرتبط</h3>
        <HomeProductStrip
          loading={loading || !started}
          items={items}
          emptyMessage=""
          getItemKey={(product) => product.id}
          renderItem={(product) => <ProductCard product={product} />}
        />
      </div>
    </div>
  );
}
