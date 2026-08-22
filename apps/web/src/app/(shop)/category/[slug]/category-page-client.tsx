'use client';

import { useParams } from 'next/navigation';
import { useCallback } from 'react';
import { ProductCard } from '@/components/shop/product-card';
import { ProductsLoadMore } from '@/components/shop/products-load-more';
import { api } from '@/lib/api';
import { useInfiniteList } from '@/lib/use-infinite-list';
import { useRestoreListScroll } from '@/lib/use-restore-list-scroll';
import { useCategories } from '@/stores/categories-store';

const CATEGORY_PAGE_SIZE = 24;

export function CategoryPageClient() {
  const { slug } = useParams<{ slug: string }>();
  const { parts, loading: categoriesLoading } = useCategories();
  const category = parts.find((c) => c.slug === slug);

  const fetchPage = useCallback(
    async (page: number, signal: AbortSignal) => {
      const res = await api.products.list(
        {
          categoryId: category!.id,
          limit: String(CATEGORY_PAGE_SIZE),
          page: String(page),
        },
        { signal },
      );
      return { items: res.products as any[], totalPages: res.totalPages };
    },
    [category],
  );

  const {
    items: products,
    initialLoading,
    loadingMore,
    hasMore,
    loadError,
    loadMore,
  } = useInfiniteList({
    queryKey: category?.id ?? '',
    enabled: Boolean(category) && !categoriesLoading,
    fetchPage,
    getItemId: (item) => item.id,
  });

  useRestoreListScroll(!initialLoading && products.length > 0);

  if (categoriesLoading || (category && initialLoading && products.length === 0)) {
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
          <ProductsLoadMore
            hasMore={hasMore}
            loadingMore={loadingMore}
            loadError={loadError}
            onLoadMore={loadMore}
            enabled={!initialLoading}
          />
        </>
      ) : (
        <p className="text-muted-foreground py-16 text-center">محصولی در این دسته‌بندی یافت نشد</p>
      )}
    </div>
  );
}
