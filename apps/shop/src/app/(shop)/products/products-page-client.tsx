'use client';

import { SITE_NAME_FA } from '@offroad/shared';
import { Loader2, SlidersHorizontal } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollToTopButton } from '@/components/layout/scroll-to-top-button';
import { ProductCard } from '@/components/shop/product-card';
import {
  ProductsFilterSidebar,
  type ProductsFilters,
} from '@/components/shop/products-filter-sidebar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { api } from '@/lib/api';
import { PRICE_FILTER_MAX } from '@/lib/product-utils';
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
const PRODUCTS_PAGE_SIZE = 20;

export function ProductsPageClient() {
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get('search') ?? '';

  const [products, setProducts] = useState<any[]>([]);
  const { libraries, loading: categoriesLoading } = useCategories();
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState<ProductsFilters>(defaultFilters);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(urlSearch);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef(false);
  const requestIdRef = useRef(0);
  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);

  useEffect(() => {
    setSearchQuery(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  const buildParams = useCallback(
    (pageNum: number) => {
      const p: Record<string, string> = {
        page: String(pageNum),
        limit: String(PRODUCTS_PAGE_SIZE),
        advertiser: 'SHOP',
      };
      if (searchQuery.trim()) p.search = searchQuery.trim();
      if (filters.categoryId) p.categoryId = filters.categoryId;
      if (filters.carBrand) p.carBrand = filters.carBrand;
      if (filters.minPrice > 0) p.minPrice = String(filters.minPrice);
      if (filters.maxPrice < PRICE_FILTER_MAX) p.maxPrice = String(filters.maxPrice);
      if (filters.situation) p.situation = filters.situation;
      if (filters.hasGuarantee) p.hasGuarantee = filters.hasGuarantee;
      return p;
    },
    [searchQuery, filters],
  );

  const queryKey = useMemo(() => JSON.stringify({ searchQuery, filters }), [searchQuery, filters]);

  useEffect(() => {
    if (categoriesLoading) return;

    const requestId = ++requestIdRef.current;
    let cancelled = false;

    const loadInitial = async () => {
      setInitialLoading(true);
      setLoadingMore(false);
      loadingMoreRef.current = false;
      setProducts([]);
      setPage(1);
      pageRef.current = 1;
      setHasMore(true);
      hasMoreRef.current = true;

      try {
        const res = await api.products.list(buildParams(1));
        if (cancelled || requestIdRef.current !== requestId) return;
        setProducts(res.products);
        setPage(1);
        const more = 1 < res.totalPages;
        setHasMore(more);
        hasMoreRef.current = more;
      } catch {
        if (cancelled || requestIdRef.current !== requestId) return;
        setProducts([]);
        setHasMore(false);
        hasMoreRef.current = false;
      } finally {
        if (!cancelled && requestIdRef.current === requestId) {
          setInitialLoading(false);
        }
      }
    };

    void loadInitial();
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });

    return () => {
      cancelled = true;
    };
  }, [categoriesLoading, queryKey, buildParams]);

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMoreRef.current || initialLoading) return;

    loadingMoreRef.current = true;
    setLoadingMore(true);
    const nextPage = pageRef.current + 1;
    const requestId = requestIdRef.current;

    try {
      const res = await api.products.list(buildParams(nextPage));
      if (requestIdRef.current !== requestId) return;

      setProducts((prev) => {
        const seen = new Set(prev.map((item) => item.id));
        const fresh = res.products.filter((item: { id: string }) => !seen.has(item.id));
        return prev.concat(fresh);
      });
      setPage(nextPage);
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
  }, [buildParams, initialLoading]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore || initialLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadMore();
        }
      },
      { root: null, rootMargin: '480px 0px', threshold: 0 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, initialLoading, loadMore, products.length]);

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

              <div ref={sentinelRef} className="h-1 w-full" aria-hidden />

              {loadingMore ? (
                <div
                  className="text-muted-foreground flex items-center justify-center gap-2 py-6 text-sm"
                  role="status"
                  aria-live="polite"
                >
                  <Loader2 className="size-4 animate-spin" />
                  در حال بارگذاری...
                </div>
              ) : null}
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
