'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { HomeProductStrip } from '@/components/home/home-product-strip';
import { ProductCard } from '@/components/shop/product-card';
import { api } from '@/lib/api';

const HOME_SECTION_LIMIT = '10';

type LazyLibraryStripProps = {
  libraryId: string;
  libraryName: string;
  seeAllHref: string;
  /** Load immediately (first rows above the fold). */
  eager?: boolean;
  onSettled?: (libraryId: string, hasItems: boolean) => void;
};

function isAbortError(err: unknown) {
  return err instanceof Error && err.name === 'AbortError';
}

/**
 * Fetches a library product strip when near the viewport (or immediately if eager).
 */
export function LazyLibraryStrip({
  libraryId,
  libraryName,
  seeAllHref,
  eager = false,
  onSettled,
}: LazyLibraryStripProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(eager);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(eager);
  const [visible, setVisible] = useState(true);

  const onSettledRef = useRef(onSettled);
  onSettledRef.current = onSettled;

  useEffect(() => {
    if (eager || shouldLoad) return;
    const el = rootRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '480px 0px', threshold: 0.01 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [eager, shouldLoad]);

  useEffect(() => {
    if (!shouldLoad) return;

    const controller = new AbortController();
    setLoading(true);

    void (async () => {
      try {
        const res = await api.products.list(
          {
            advertiser: 'SHOP',
            libraryId,
            limit: HOME_SECTION_LIMIT,
          },
          { signal: controller.signal },
        );
        if (controller.signal.aborted) return;
        const next = res.products ?? [];
        setItems(next);
        setVisible(next.length > 0);
        onSettledRef.current?.(libraryId, next.length > 0);
      } catch (err) {
        if (isAbortError(err) || controller.signal.aborted) return;
        setItems([]);
        setVisible(false);
        onSettledRef.current?.(libraryId, false);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [shouldLoad, libraryId]);

  if (!shouldLoad) {
    return <div ref={rootRef} className="min-h-40" aria-hidden />;
  }

  if (!loading && !visible) return null;

  return (
    <div
      ref={rootRef}
      className="rounded-2xl border border-border/70 bg-card/70 p-4 shadow-sm sm:p-5"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold sm:text-lg">{libraryName}</h3>
        <Link
          href={seeAllHref}
          className="text-primary flex items-center gap-1 text-sm hover:underline"
        >
          مشاهده همه <ArrowLeft className="h-4 w-4" />
        </Link>
      </div>
      <HomeProductStrip
        loading={loading}
        items={items}
        emptyMessage=""
        getItemKey={(product) => product.id}
        renderItem={(product) => <ProductCard product={product} />}
      />
    </div>
  );
}
