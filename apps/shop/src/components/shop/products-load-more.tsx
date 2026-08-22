'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

type ProductsLoadMoreProps = {
  hasMore: boolean;
  loadingMore: boolean;
  loadError: boolean;
  onLoadMore: () => void;
  enabled?: boolean;
};

/**
 * Hybrid footer: prefetches via IntersectionObserver, with a manual button
 * for retries and when the sentinel miss-fires (scroll away mid-request).
 */
export function ProductsLoadMore({
  hasMore,
  loadingMore,
  loadError,
  onLoadMore,
  enabled = true,
}: ProductsLoadMoreProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const onLoadMoreRef = useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore || !enabled || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMoreRef.current();
        }
      },
      { root: null, rootMargin: '400px 0px', threshold: 0 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, enabled, loadingMore, loadError]);

  if (!hasMore && !loadError) return null;

  return (
    <div className="flex flex-col items-center gap-3 py-6">
      <div ref={sentinelRef} className="h-1 w-full" aria-hidden />

      {loadingMore ? (
        <div
          className="text-muted-foreground flex items-center justify-center gap-2 text-sm"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="size-4 animate-spin" />
          در حال بارگذاری...
        </div>
      ) : (
        <>
          {loadError ? (
            <p className="text-destructive text-center text-sm">
              بارگذاری محصولات بیشتر ناموفق بود. دوباره تلاش کنید.
            </p>
          ) : null}
          <Button
            type="button"
            variant={loadError ? 'default' : 'outline'}
            size="sm"
            onClick={() => onLoadMore()}
            className="min-w-40"
          >
            {loadError ? 'تلاش مجدد' : 'مشاهده محصولات بیشتر'}
          </Button>
        </>
      )}
    </div>
  );
}
