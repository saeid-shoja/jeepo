'use client';

import { ArrowLeft, Store } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { HomeProductStrip } from '@/components/home/home-product-strip';
import { LazyLibraryStrip } from '@/components/home/lazy-library-strip';
import { filterShopSaleCategories } from '@/lib/shop-category-filters';
import { type LibraryNode, useCategoriesStore } from '@/stores/categories-store';

const EAGER_STRIP_COUNT = 2;
const LIBRARY_SKELETON_KEYS = ['lib-sk-1', 'lib-sk-2'] as const;

type StripStatus = 'pending' | 'ready' | 'empty';

export default function MainSection() {
  const rawLibraries = useCategoriesStore((s) => s.libraries);
  const categoriesLoading = useCategoriesStore((s) => s.loading);
  const libraries = useMemo(() => filterShopSaleCategories(rawLibraries), [rawLibraries]);
  const [statuses, setStatuses] = useState<Record<string, StripStatus>>({});

  useEffect(() => {
    setStatuses(Object.fromEntries(libraries.map((lib) => [lib.id, 'pending' as const])));
  }, [libraries]);

  const onSettled = useCallback((libraryId: string, hasItems: boolean) => {
    setStatuses((prev) => ({
      ...prev,
      [libraryId]: hasItems ? 'ready' : 'empty',
    }));
  }, []);

  const showSkeletons = categoriesLoading || libraries.length === 0;

  const eagerSettled =
    !showSkeletons &&
    libraries
      .slice(0, EAGER_STRIP_COUNT)
      .every((lib) => statuses[lib.id] === 'ready' || statuses[lib.id] === 'empty');

  const eagerHasItems = libraries
    .slice(0, EAGER_STRIP_COUNT)
    .some((lib) => statuses[lib.id] === 'ready');

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
      ) : eagerSettled && !eagerHasItems && libraries.length <= EAGER_STRIP_COUNT ? (
        <div className="container">
          <p className="text-muted-foreground py-8 text-center">به زودی محصولات جدید اضافه می‌شود</p>
        </div>
      ) : (
        <div className="container space-y-8">
          {libraries.map((lib: LibraryNode, index) => (
            <LazyLibraryStrip
              key={lib.id}
              libraryId={lib.id}
              libraryName={lib.name}
              seeAllHref={`/products?libraryId=${encodeURIComponent(lib.id)}`}
              eager={index < EAGER_STRIP_COUNT}
              onSettled={onSettled}
            />
          ))}
        </div>
      )}
    </section>
  );
}
