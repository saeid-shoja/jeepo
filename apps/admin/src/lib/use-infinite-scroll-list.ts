'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export const ADMIN_LIST_PAGE_SIZE = 24;

type PageResult<T> = {
  items: T[];
  totalPages: number;
};

type UseInfiniteScrollListOptions<T extends { id: string }> = {
  fetchPage: (page: number) => Promise<PageResult<T>>;
  deps: readonly unknown[];
  enabled?: boolean;
};

export function useInfiniteScrollList<T extends { id: string }>({
  fetchPage,
  deps,
  enabled = true,
}: UseInfiniteScrollListOptions<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(1);
  const requestIdRef = useRef(0);
  const loadingMoreRef = useRef(false);
  const hasMoreRef = useRef(true);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const depsKey = JSON.stringify(deps);

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMoreRef.current || initialLoading) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    const nextPage = pageRef.current + 1;
    const requestId = requestIdRef.current;
    try {
      const res = await fetchPage(nextPage);
      if (requestIdRef.current !== requestId) return;
      setItems((prev) => {
        const seen = new Set(prev.map((item) => item.id));
        const fresh = res.items.filter((item) => !seen.has(item.id));
        return prev.concat(fresh);
      });
      pageRef.current = nextPage;
      const more = nextPage < res.totalPages;
      setHasMore(more);
      hasMoreRef.current = more;
    } catch {
      if (requestIdRef.current !== requestId) return;
      setHasMore(false);
      hasMoreRef.current = false;
    } finally {
      if (requestIdRef.current === requestId) {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      }
    }
  }, [fetchPage, initialLoading]);

  useEffect(() => {
    if (!enabled) return;
    const requestId = ++requestIdRef.current;
    let cancelled = false;

    const loadInitial = async () => {
      setInitialLoading(true);
      setLoadingMore(false);
      loadingMoreRef.current = false;
      setItems([]);
      pageRef.current = 1;
      setHasMore(true);
      hasMoreRef.current = true;

      try {
        const res = await fetchPage(1);
        if (cancelled || requestIdRef.current !== requestId) return;
        setItems(res.items);
        const more = res.totalPages > 1;
        setHasMore(more);
        hasMoreRef.current = more;
      } catch {
        if (cancelled || requestIdRef.current !== requestId) return;
        setItems([]);
        setHasMore(false);
        hasMoreRef.current = false;
      } finally {
        if (!cancelled && requestIdRef.current === requestId) {
          setInitialLoading(false);
        }
      }
    };

    void loadInitial();

    return () => {
      cancelled = true;
    };
  }, [depsKey, enabled, fetchPage]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore || initialLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      { rootMargin: '240px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, initialLoading, loadMore, items.length]);

  return {
    items,
    setItems,
    initialLoading,
    loadingMore,
    hasMore,
    sentinelRef,
  };
}
