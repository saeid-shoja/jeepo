'use client';

import { ArrowLeft, Store } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { HomeProductStrip } from '@/components/home/home-product-strip';
import { ProductCard } from '@/components/shop/product-card';
import { api } from '@/lib/api';
import { filterShopSaleCategories } from '@/lib/shop-category-filters';
import { type LibraryNode, useCategoriesStore } from '@/stores/categories-store';

const HOME_SECTION_LIMIT = '10';
const LIBRARY_SKELETON_KEYS = [
  'lib-sk-1',
  'lib-sk-2',
  'lib-sk-3',
  'lib-sk-4',
  'lib-sk-5',
  'lib-sk-6',
] as const;

type LibraryStripState = {
  items: any[];
  loading: boolean;
};

function emptyStripMap(libraries: LibraryNode[]): Record<string, LibraryStripState> {
  return Object.fromEntries(libraries.map((lib) => [lib.id, { items: [], loading: true }]));
}

export default function MainSection() {
  const rawLibraries = useCategoriesStore((s) => s.libraries);
  const categoriesLoading = useCategoriesStore((s) => s.loading);
  const libraries = useMemo(() => filterShopSaleCategories(rawLibraries), [rawLibraries]);
  const [strips, setStrips] = useState<Record<string, LibraryStripState>>({});

  useEffect(() => {
    if (categoriesLoading || libraries.length === 0) return;

    setStrips(emptyStripMap(libraries));
    let cancelled = false;

    void (async () => {
      await Promise.all(
        libraries.map(async (lib) => {
          let items: any[] = [];
          try {
            const res = await api.products.list({
              advertiser: 'SHOP',
              libraryId: lib.id,
              limit: HOME_SECTION_LIMIT,
            });
            items = res.products ?? [];
          } catch {
            items = [];
          }
          if (cancelled) return;
          setStrips((prev) => ({
            ...prev,
            [lib.id]: { items, loading: false },
          }));
        }),
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [categoriesLoading, libraries]);

  const showSkeletons = categoriesLoading || libraries.length === 0;

  const visible = libraries.filter((lib) => {
    const strip = strips[lib.id];
    if (!strip) return false;
    return strip.loading || strip.items.length > 0;
  });

  const allSettled =
    !showSkeletons && libraries.every((lib) => strips[lib.id] && !strips[lib.id].loading);
  const anyVisible = visible.some((lib) => (strips[lib.id]?.items.length ?? 0) > 0);

  return (
    <section className="bg-border/30 -mx-4 px-4 py-5">
      <div className="container mb-5 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <Store className="text-primary h-6 w-6" />
          محصولات فروشگاه
        </h2>
        <Link
          href="/products"
          className="text-primary flex items-center gap-1 text-sm hover:underline"
        >
          مشاهده همه <ArrowLeft className="h-4 w-4" />
        </Link>
      </div>

      {showSkeletons ? (
        <div className="container space-y-8">
          {LIBRARY_SKELETON_KEYS.map((key) => (
            <HomeProductStrip
              key={key}
              loading
              items={[]}
              emptyMessage=""
              getItemKey={() => ''}
              renderItem={() => null}
            />
          ))}
        </div>
      ) : allSettled && !anyVisible ? (
        <div className="container">
          <p className="text-muted-foreground py-8 text-center">به زودی محصولات جدید اضافه می‌شود</p>
        </div>
      ) : (
        <div className="container space-y-8">
          {visible.map((lib) => {
            const strip = strips[lib.id] ?? { items: [], loading: true };
            return (
              <div
                key={lib.id}
                className="rounded-2xl border border-border/70 bg-card/70 p-4 shadow-sm sm:p-5"
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-semibold sm:text-lg">{lib.name}</h3>
                  <Link
                    href={`/products?libraryId=${encodeURIComponent(lib.id)}`}
                    className="text-primary flex items-center gap-1 text-sm hover:underline"
                  >
                    مشاهده همه <ArrowLeft className="h-4 w-4" />
                  </Link>
                </div>
                <HomeProductStrip
                  loading={strip.loading}
                  items={strip.items}
                  emptyMessage=""
                  getItemKey={(product) => product.id}
                  renderItem={(product) => <ProductCard product={product} />}
                />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
