'use client';

import { Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ProductCard } from '@/components/shop/product-card';
import { api } from '@/lib/api';
import { useCategories } from '@/stores/categories-store';

const CATEGORY_PAGE_SIZE = 24;

export function CategoryPageClient() {
  const { slug } = useParams<{ slug: string }>();
  const { parts, loading: categoriesLoading } = useCategories();
  const category = parts.find((c) => c.slug === slug);

  const [products, setProducts] = useState<any[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);
  const loadingMoreRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const buildParams = useCallback(
    (page: number) => ({
      categoryId: category!.id,
      advertiser: 'SHOP',
      limit: String(CATEGORY_PAGE_SIZE),
      page: String(page),
    }),
    [category],
  );

  useEffect(() => {
    if (!category) {
      setInitialLoading(false);
      setProducts([]);
      return;
    }

    let cancelled = false;
    setInitialLoading(true);
    setProducts([]);
    pageRef.current = 1;
    setHasMore(true);
    hasMoreRef.current = true;

    void api.products
      .list(buildParams(1))
      .then((res) => {
        if (cancelled) return;
        setProducts(res.products);
        const more = res.totalPages > 1;
        setHasMore(more);
        hasMoreRef.current = more;
      })
      .catch(() => {
        if (cancelled) return;
        setProducts([]);
        setHasMore(false);
        hasMoreRef.current = false;
      })
      .finally(() => {
        if (!cancelled) setInitialLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [category, buildParams]);

  const loadMore = useCallback(async () => {
    if (!category || loadingMoreRef.current || !hasMoreRef.current || initialLoading) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    const nextPage = pageRef.current + 1;
    try {
      const res = await api.products.list(buildParams(nextPage));
      setProducts((prev) => {
        const seen = new Set(prev.map((item) => item.id));
        const fresh = res.products.filter((item: { id: string }) => !seen.has(item.id));
        return prev.concat(fresh);
      });
      pageRef.current = nextPage;
      const more = nextPage < res.totalPages;
      setHasMore(more);
      hasMoreRef.current = more;
    } catch {
      setHasMore(false);
      hasMoreRef.current = false;
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [category, buildParams, initialLoading]);

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
  }, [hasMore, initialLoading, loadMore, products.length]);

  if (categoriesLoading || initialLoading) {
    return <div className="text-muted-foreground py-16 text-center">در حال بارگذاری...</div>;
  }

  if (!category) {
    return <div className="text-muted-foreground py-16 text-center">دسته‌بندی یافت نشد</div>;
  }

  return (
    <div className="container space-y-6">
      <h1 className="text-2xl font-bold">{category.name}</h1>
      {products.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {loadingMore ? (
            <div className="flex justify-center py-4">
              <Loader2 className="text-primary size-6 animate-spin" />
            </div>
          ) : null}
          {hasMore ? <div ref={sentinelRef} className="h-1" aria-hidden /> : null}
        </>
      ) : (
        <p className="text-muted-foreground py-16 text-center">محصولی در این دسته‌بندی یافت نشد</p>
      )}
    </div>
  );
}
