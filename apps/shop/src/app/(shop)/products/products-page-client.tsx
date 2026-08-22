'use client';

import { SITE_NAME_FA } from '@offroad/shared';
import { SlidersHorizontal } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollToTopButton } from '@/components/layout/scroll-to-top-button';
import { ProductCard } from '@/components/shop/product-card';
import {
  ProductsFilterSidebar,
  type ProductsFilters,
} from '@/components/shop/products-filter-sidebar';
import { ProductsLoadMore } from '@/components/shop/products-load-more';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { api } from '@/lib/api';
import { PRICE_FILTER_MAX } from '@/lib/product-utils';
import { useInfiniteList } from '@/lib/use-infinite-list';
import { useCategories } from '@/stores/categories-store';

const defaultFilters: ProductsFilters = {
  categoryId: '',
  carBrand: '',
  minPrice: 0,
  maxPrice: PRICE_FILTER_MAX,
  situation: '',
  hasGuarantee: '',
};

const PRODUCT_SKELETON_KEYS = ['sk-1', 'sk-2', 'sk-3', 'sk-4', 'sk-5', 'sk-6'] as const;
const PRODUCTS_PAGE_SIZE = 24;

export function ProductsPageClient() {
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get('search') ?? '';
  const libraryId = searchParams.get('libraryId') ?? '';

  const { libraries, loading: categoriesLoading } = useCategories();
  const [filters, setFilters] = useState<ProductsFilters>(defaultFilters);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(urlSearch);

  useEffect(() => {
    setSearchQuery(urlSearch);
  }, [urlSearch]);

  const buildParams = useCallback(
    (pageNum: number) => {
      const p: Record<string, string> = {
        page: String(pageNum),
        limit: String(PRODUCTS_PAGE_SIZE),
        advertiser: 'SHOP',
      };
      if (searchQuery.trim()) p.search = searchQuery.trim();
      if (libraryId) p.libraryId = libraryId;
      if (filters.categoryId) p.categoryId = filters.categoryId;
      if (filters.carBrand) p.carBrand = filters.carBrand;
      if (filters.minPrice > 0) p.minPrice = String(filters.minPrice);
      if (filters.maxPrice < PRICE_FILTER_MAX) p.maxPrice = String(filters.maxPrice);
      if (filters.situation) p.situation = filters.situation;
      if (filters.hasGuarantee) p.hasGuarantee = filters.hasGuarantee;
      return p;
    },
    [searchQuery, filters, libraryId],
  );

  const queryKey = useMemo(
    () => JSON.stringify({ searchQuery, filters, libraryId }),
    [searchQuery, filters, libraryId],
  );

  const fetchPage = useCallback(
    async (page: number, signal: AbortSignal) => {
      const res = await api.products.list(buildParams(page), { signal });
      return { items: res.products as any[], totalPages: res.totalPages };
    },
    [buildParams],
  );

  const {
    items: products,
    initialLoading,
    loadingMore,
    hasMore,
    loadError,
    loadMore,
  } = useInfiniteList({
    queryKey,
    enabled: !categoriesLoading,
    fetchPage,
    getItemId: (item) => item.id,
  });

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [queryKey]);

  const handleApplyFilters = () => {
    setMobileFiltersOpen(false);
  };

  const handleResetFilters = () => {
    setFilters(defaultFilters);
    setMobileFiltersOpen(false);
  };

  const filterSidebar = (
    <ProductsFilterSidebar
      filters={filters}
      libraries={libraries}
      onChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
      onApply={handleApplyFilters}
      onReset={handleResetFilters}
    />
  );

  return (
    <div className="space-y-6 container">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">محصولات فروشگاه {SITE_NAME_FA}</h1>
          {searchQuery && (
            <p className="text-muted-foreground mt-1 text-sm">
              نتایج جستجو برای: <span className="font-medium">{searchQuery}</span>
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-5 z-20 max-h-[calc(100vh-2.5rem)] overflow-y-auto overscroll-contain pe-1">
            {filterSidebar}
          </div>
        </aside>

        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden">
                  <SlidersHorizontal className="h-4 w-4" />
                  فیلترها
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>فیلتر محصولات</SheetTitle>
                </SheetHeader>
                <div className="mt-4">{filterSidebar}</div>
              </SheetContent>
            </Sheet>
          </div>

          {initialLoading && products.length === 0 ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-5">
              {PRODUCT_SKELETON_KEYS.map((key) => (
                <div key={key} className="bg-muted aspect-4/5 animate-pulse rounded-sm" />
              ))}
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-5">
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
            <p className="text-muted-foreground py-16 text-center">محصولی یافت نشد</p>
          )}
        </div>
      </div>

      <ScrollToTopButton />
    </div>
  );
}
