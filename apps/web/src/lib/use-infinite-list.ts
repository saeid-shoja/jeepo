'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type PagedListResult<T> = {
  items: T[];
  totalPages: number;
};

type UseInfiniteListOptions<T> = {
  /** Stable key — when it changes, list resets to page 1. */
  queryKey: string;
  enabled?: boolean;
  fetchPage: (page: number, signal: AbortSignal) => Promise<PagedListResult<T>>;
  getItemId: (item: T) => string;
  /** Optional: restore N pages on first load (web scroll restore). */
  initialPagesToLoad?: number;
  onPageChange?: (page: number) => void;
};

function isAbortError(err: unknown) {
  return err instanceof Error && err.name === 'AbortError';
}

/**
 * Hybrid infinite list: IntersectionObserver + explicit Load more.
 * Keeps loading lock resettable and does not kill hasMore on network errors.
 * Aborts in-flight requests when queryKey changes.
 */
export function useInfiniteList<T>({
  queryKey,
  enabled = true,
  fetchPage,
  getItemId,
  initialPagesToLoad = 1,
  onPageChange,
}: UseInfiniteListOptions<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);
  const loadingMoreRef = useRef(false);
  const generationRef = useRef(0);
  const fetchPageRef = useRef(fetchPage);
  const getItemIdRef = useRef(getItemId);
  const onPageChangeRef = useRef(onPageChange);
  const initialPagesRef = useRef(initialPagesToLoad);
  const abortRef = useRef<AbortController | null>(null);

  fetchPageRef.current = fetchPage;
  getItemIdRef.current = getItemId;
  onPageChangeRef.current = onPageChange;
  initialPagesRef.current = initialPagesToLoad;

  const appendUnique = useCallback((prev: T[], next: T[]) => {
    const seen = new Set(prev.map((item) => getItemIdRef.current(item)));
    const fresh = next.filter((item) => !seen.has(getItemIdRef.current(item)));
    return prev.concat(fresh);
  }, []);

  useEffect(() => {
    if (!enabled) {
      abortRef.current?.abort();
      abortRef.current = null;
      setInitialLoading(false);
      setItems([]);
      setHasMore(false);
      hasMoreRef.current = false;
      return;
    }

    const generation = ++generationRef.current;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const loadInitial = async () => {
      setInitialLoading(true);
      setLoadingMore(false);
      loadingMoreRef.current = false;
      setLoadError(false);
      setItems([]);
      pageRef.current = 1;
      setHasMore(true);
      hasMoreRef.current = true;
      onPageChangeRef.current?.(1);

      const pagesToLoad = Math.max(1, initialPagesRef.current);

      try {
        let all: T[] = [];
        let totalPages = 1;
        let lastPage = 1;

        for (let page = 1; page <= pagesToLoad; page++) {
          const res = await fetchPageRef.current(page, controller.signal);
          if (controller.signal.aborted || generationRef.current !== generation) return;

          all = page === 1 ? res.items : appendUnique(all, res.items);
          totalPages = res.totalPages;
          lastPage = page;
          setItems(all);
          pageRef.current = lastPage;
          onPageChangeRef.current?.(lastPage);

          const more = lastPage < totalPages;
          setHasMore(more);
          hasMoreRef.current = more;

          if (page === 1) {
            setInitialLoading(false);
            if (pagesToLoad > 1 && more) {
              setLoadingMore(true);
              loadingMoreRef.current = true;
            }
          }

          if (!more) break;
        }
      } catch (err) {
        if (
          isAbortError(err) ||
          controller.signal.aborted ||
          generationRef.current !== generation
        ) {
          return;
        }
        setItems([]);
        setHasMore(false);
        hasMoreRef.current = false;
        setLoadError(true);
      } finally {
        if (!controller.signal.aborted && generationRef.current === generation) {
          setInitialLoading(false);
          setLoadingMore(false);
          loadingMoreRef.current = false;
        }
      }
    };

    void loadInitial();

    return () => {
      controller.abort();
    };
  }, [enabled, queryKey, appendUnique]);

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMoreRef.current || initialLoading) return;

    const generation = generationRef.current;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    setLoadError(false);

    const nextPage = pageRef.current + 1;
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetchPageRef.current(nextPage, controller.signal);
      if (controller.signal.aborted || generationRef.current !== generation) return;

      setItems((prev) => appendUnique(prev, res.items));
      pageRef.current = nextPage;
      onPageChangeRef.current?.(nextPage);

      const more = nextPage < res.totalPages;
      setHasMore(more);
      hasMoreRef.current = more;
    } catch (err) {
      if (isAbortError(err) || controller.signal.aborted || generationRef.current !== generation) {
        return;
      }
      // Keep hasMore so user can retry via button / sentinel.
      setLoadError(true);
    } finally {
      // Always clear lock for this attempt (even after query reset race).
      if (generationRef.current === generation) {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      } else {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      }
    }
  }, [appendUnique, initialLoading]);

  return {
    items,
    initialLoading,
    loadingMore,
    hasMore,
    loadError,
    loadMore,
    page: pageRef.current,
  };
}
