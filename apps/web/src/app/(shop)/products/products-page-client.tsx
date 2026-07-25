'use client';

import { SITE_NAME_FA } from '@offroad/shared';
import { SlidersHorizontal } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ProductCard } from '@/components/shop/product-card';
import {
  ProductsFilterSidebar,
  type ProductsFilters,
} from '@/components/shop/products-filter-sidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { api } from '@/lib/api';
import { PRICE_FILTER_MAX } from '@/lib/product-utils';
import { useCategories } from '@/stores/categories-store';
import { useLocationFilter } from '@/stores/location-store';

const defaultFilters: ProductsFilters = {
  categoryId: '',
  carBrand: '',
  minPrice: 0,
  maxPrice: PRICE_FILTER_MAX,
  postedWithin: '',
  situation: '',
  hasGuarantee: '',
};

const PRODUCT_SKELETON_KEYS = ['sk-1', 'sk-2', 'sk-3', 'sk-4', 'sk-5', 'sk-6'] as const;
const PRODUCTS_PAGE_SIZE = 20;

function getVisiblePages(current: number, total: number): number[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  return [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
}

function parsePageParam(raw: string | null): number {
  const n = Number.parseInt(raw ?? '1', 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

export function ProductsPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const advertiserType = useMemo(() => {
    const raw = searchParams.get('advertiserType');
    if (raw === 'SHOP' || raw === 'CLIENT' || raw === 'AUCTION') return raw;
    return 'CLIENT';
  }, [searchParams]);
  const urlSearch = searchParams.get('search') ?? '';
  const page = useMemo(() => parsePageParam(searchParams.get('page')), [searchParams]);

  const [products, setProducts] = useState<any[]>([]);
  const { libraries, loading: categoriesLoading } = useCategories();
  const { selectedCities, hasFilter } = useLocationFilter();
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ProductsFilters>(defaultFilters);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState<'CLIENT' | 'SHOP' | 'AUCTION'>(
    advertiserType as 'CLIENT' | 'SHOP' | 'AUCTION',
  );
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(urlSearch);

  const setListPage = useCallback(
    (nextPage: number, method: 'push' | 'replace' = 'push') => {
      const params = new URLSearchParams(searchParams.toString());
      if (nextPage <= 1) params.delete('page');
      else params.set('page', String(nextPage));
      const qs = params.toString();
      const href = qs ? `${pathname}?${qs}` : pathname;
      if (method === 'push') router.push(href, { scroll: true });
      else router.replace(href, { scroll: true });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    setSearchQuery(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    setActiveTab(advertiserType as 'CLIENT' | 'SHOP' | 'AUCTION');
  }, [advertiserType]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [page]);

  const buildParams = useCallback(
    (overrides?: { page?: number }) => {
      const p: Record<string, string> = {
        page: String(overrides?.page ?? page),
        limit: String(PRODUCTS_PAGE_SIZE),
      };
      if (activeTab === 'AUCTION') {
        p.auction = 'true';
      } else {
        p.advertiser = activeTab;
      }
      if (searchQuery.trim()) p.search = searchQuery.trim();
      if (filters.categoryId) p.categoryId = filters.categoryId;
      if (filters.carBrand) p.carBrand = filters.carBrand;
      if (selectedCities.length) p.cities = selectedCities.join(',');
      if (filters.postedWithin) p.postedWithin = filters.postedWithin;
      if (filters.minPrice > 0) p.minPrice = String(filters.minPrice);
      if (filters.maxPrice < PRICE_FILTER_MAX) p.maxPrice = String(filters.maxPrice);
      if (filters.situation) p.situation = filters.situation;
      if (filters.hasGuarantee) p.hasGuarantee = filters.hasGuarantee;
      return p;
    },
    [activeTab, page, searchQuery, filters, selectedCities],
  );

  const fetchProducts = useCallback((pageNum: number) => {
    setLoading(true);
    api.products
      .list(buildParams({ page: pageNum }))
      .then((res) => {
        setProducts(res.products);
        setTotalPages(res.totalPages);
      })
      .finally(() => setLoading(false));
  }, [buildParams]);

  useEffect(() => {
    if (categoriesLoading) return;
    fetchProducts(page);
  }, [page, categoriesLoading, fetchProducts]);

  const handleApplyFilters = () => {
    setMobileFiltersOpen(false);
    if (page !== 1) {
      setListPage(1, 'replace');
    } else {
      fetchProducts(1);
    }
  };

  const handleResetFilters = () => {
    setFilters(defaultFilters);
    setMobileFiltersOpen(false);
    if (page !== 1) {
      setListPage(1, 'replace');
    } else {
      fetchProducts(1);
    }
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

  const setTab = (tab: 'CLIENT' | 'SHOP' | 'AUCTION') => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('advertiserType', tab);
    params.delete('page');
    router.replace(`${pathname}?${params.toString()}`, { scroll: true });
  };

  return (
    <div className="space-y-6 container">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {activeTab === 'SHOP'
              ? 'محصولات فروشگاه'
              : activeTab === 'AUCTION'
                ? 'مزایده‌ها'
                : `بازارچه ${SITE_NAME_FA}`}
          </h1>
          {searchQuery && (
            <p className="text-muted-foreground mt-1 text-sm">
              نتایج جستجو برای: <span className="font-medium">{searchQuery}</span>
            </p>
          )}
          {hasFilter && (
            <div className="mt-2 flex flex-wrap gap-1">
              {selectedCities.map((city) => (
                <Badge key={city} variant="secondary">
                  {city}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'CLIENT' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('CLIENT')}
          >
            آگهی‌های کاربران
          </Button>
          <Button
            variant={activeTab === 'SHOP' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('SHOP')}
          >
            فروشگاه
          </Button>
          <Button
            variant={activeTab === 'AUCTION' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('AUCTION')}
          >
            مزایده‌ها
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="hidden w-full shrink-0 lg:block lg:w-72">{filterSidebar}</aside>

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

          {loading ? (
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
              {totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || loading}
                    onClick={() => setListPage(Math.max(1, page - 1))}
                  >
                    قبلی
                  </Button>
                  {getVisiblePages(page, totalPages).map((p, index, pages) => {
                    const prev = pages[index - 1];
                    const showEllipsis = prev != null && p - prev > 1;
                    return (
                      <span key={p} className="flex items-center gap-2">
                        {showEllipsis ? (
                          <span className="text-muted-foreground px-1 text-sm">…</span>
                        ) : null}
                        <Button
                          variant={page === p ? 'default' : 'outline'}
                          size="sm"
                          className="h-9 w-9 p-0"
                          disabled={loading}
                          onClick={() => setListPage(p)}
                        >
                          {p}
                        </Button>
                      </span>
                    );
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages || loading}
                    onClick={() => setListPage(Math.min(totalPages, page + 1))}
                  >
                    بعدی
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-muted-foreground py-16 text-center">
              <p className="text-lg">محصولی یافت نشد</p>
              <p className="mt-2 text-sm">جستجو، شهر یا فیلترها را تغییر دهید</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
