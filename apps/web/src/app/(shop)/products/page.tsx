'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { SlidersHorizontal } from 'lucide-react';

import { api } from '@/lib/api';
import { ProductCard } from '@/components/shop/product-card';
import {
  ProductsFilterSidebar,
  type ProductsFilters,
} from '@/components/shop/products-filter-sidebar';
import { useCategories } from '@/providers/categories-provider';
import { useLocationFilter } from '@/providers/location-provider';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { PRICE_FILTER_MAX } from '@/lib/product-utils';
import { Badge } from '@/components/ui/badge';

const defaultFilters: ProductsFilters = {
  categoryId: '',
  carBrand: '',
  minPrice: 0,
  maxPrice: PRICE_FILTER_MAX,
  postedWithin: '',
};

function ProductsPageContent() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get('type') === 'SHOP' ? 'SHOP' : 'CLIENT';
  const urlSearch = searchParams.get('search') ?? '';

  const [products, setProducts] = useState<any[]>([]);
  const { libraries, loading: categoriesLoading } = useCategories();
  const { selectedCities, hasFilter } = useLocationFilter();
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ProductsFilters>(defaultFilters);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [type, setType] = useState(initialType);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(urlSearch);

  useEffect(() => {
    setSearchQuery(urlSearch);
    setPage(1);
  }, [urlSearch]);

  const buildParams = useCallback(
    (overrides?: { page?: number }) => {
      const p: Record<string, string> = {
        type,
        page: String(overrides?.page ?? page),
        limit: '20',
      };
      if (searchQuery.trim()) p.search = searchQuery.trim();
      if (filters.categoryId) p.categoryId = filters.categoryId;
      if (filters.carBrand) p.carBrand = filters.carBrand;
      if (selectedCities.length) p.cities = selectedCities.join(',');
      if (filters.postedWithin) p.postedWithin = filters.postedWithin;
      if (filters.minPrice > 0) p.minPrice = String(filters.minPrice);
      if (filters.maxPrice < PRICE_FILTER_MAX) p.maxPrice = String(filters.maxPrice);
      return p;
    },
    [type, page, searchQuery, filters, selectedCities],
  );

  const fetchProducts = useCallback(
    (pageNum = page) => {
      setLoading(true);
      api.products
        .list(buildParams({ page: pageNum }))
        .then((res) => {
          setProducts(res.products);
          setTotalPages(res.totalPages);
        })
        .finally(() => setLoading(false));
    },
    [buildParams, page],
  );

  useEffect(() => {
    if (categoriesLoading) return;
    fetchProducts(page);
  }, [
    type,
    page,
    searchQuery,
    filters.categoryId,
    filters.carBrand,
    filters.postedWithin,
    selectedCities,
    categoriesLoading,
  ]);

  const handleApplyFilters = () => {
    setPage(1);
    setMobileFiltersOpen(false);
    fetchProducts(1);
  };

  const handleResetFilters = () => {
    setFilters(defaultFilters);
    setPage(1);
    setMobileFiltersOpen(false);
    fetchProducts(1);
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {type === 'SHOP' ? 'محصولات فروشگاه' : 'بازارچه آفرود'}
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
            variant={type === 'CLIENT' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setType('CLIENT');
              setPage(1);
            }}
          >
            آگهی‌های کاربران
          </Button>
          <Button
            variant={type === 'SHOP' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setType('SHOP');
              setPage(1);
            }}
          >
            فروشگاه
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="hidden w-full shrink-0 lg:block lg:w-72">
          {filterSidebar}
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

          {loading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-muted aspect-[4/5] animate-pulse rounded-xl"
                />
              ))}
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <Button
                      key={p}
                      variant={page === p ? 'default' : 'outline'}
                      size="sm"
                      className="h-9 w-9 p-0"
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </Button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-muted-foreground py-16 text-center">
              <p className="text-lg">محصولی یافت نشد</p>
              <p className="mt-2 text-sm">
                جستجو، شهر یا فیلترها را تغییر دهید
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="text-muted-foreground py-16 text-center">در حال بارگذاری...</div>
      }
    >
      <ProductsPageContent />
    </Suspense>
  );
}
