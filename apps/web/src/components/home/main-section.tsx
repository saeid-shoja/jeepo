'use client';

import { ArrowLeft, PackageSearch, Store } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { HomeProductStrip } from '@/components/home/home-product-strip';
import { LazyLibraryStrip } from '@/components/home/lazy-library-strip';
import { useRestoreListScroll } from '@/lib/use-restore-list-scroll';
import { type LibraryNode, useCategories } from '@/stores/categories-store';
import BadgeInfo from './badge-info';

const EAGER_STRIP_COUNT = 2;
const LIBRARY_SKELETON_KEYS = ['lib-sk-1', 'lib-sk-2'] as const;

type StripStatus = 'pending' | 'ready' | 'empty';

function LibraryProductRows({
  libraries,
  advertiser,
  categoriesLoading,
  seeAllHref,
  onSectionReady,
}: {
  libraries: LibraryNode[];
  advertiser: 'CLIENT' | 'SHOP';
  categoriesLoading: boolean;
  seeAllHref: (library: LibraryNode) => string;
  onSectionReady?: (ready: boolean) => void;
}) {
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

  const eagerSettled =
    !categoriesLoading &&
    libraries.length > 0 &&
    libraries
      .slice(0, EAGER_STRIP_COUNT)
      .every((lib) => statuses[lib.id] === 'ready' || statuses[lib.id] === 'empty');

  const eagerHasItems = libraries
    .slice(0, EAGER_STRIP_COUNT)
    .some((lib) => statuses[lib.id] === 'ready');

  useEffect(() => {
    onSectionReady?.(eagerSettled);
  }, [eagerSettled, onSectionReady]);

  if (categoriesLoading) {
    return (
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
    );
  }

  if (eagerSettled && !eagerHasItems && libraries.length <= EAGER_STRIP_COUNT) {
    return (
      <div className="container">
        <p className="text-muted-foreground py-8 text-center">
          هنوز آگهی‌ای در این بخش ثبت نشده است
        </p>
      </div>
    );
  }

  return (
    <div className="container space-y-2">
      {libraries.map((lib, index) => (
        <LazyLibraryStrip
          key={`${advertiser}-${lib.id}`}
          libraryId={lib.id}
          libraryName={lib.name}
          advertiser={advertiser}
          seeAllHref={seeAllHref(lib)}
          eager={index < EAGER_STRIP_COUNT}
          onSettled={onSettled}
        />
      ))}
    </div>
  );
}

export default function MainSection() {
  const { libraries, loading: categoriesLoading } = useCategories();
  const [clientReady, setClientReady] = useState(false);
  const [shopReady, setShopReady] = useState(false);

  useRestoreListScroll(clientReady && shopReady);

  return (
    <div className="space-y-5 lg:space-y-10">
      <section className="border-y border-border -mx-4 px-4 py-6">
        <div className="container mb-6 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <PackageSearch className="text-secondary h-6 w-6" />
            آگهی‌های کاربران
          </h2>
          <Link
            href="/products"
            className="text-primary flex items-center gap-1 text-sm hover:underline"
          >
            مشاهده همه <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
        <LibraryProductRows
          libraries={libraries}
          advertiser="CLIENT"
          categoriesLoading={categoriesLoading || libraries.length === 0}
          seeAllHref={(lib) => `/products?libraryId=${encodeURIComponent(lib.id)}`}
          onSectionReady={setClientReady}
        />
      </section>

      <section className="bg-border/30 -mx-4 px-4 py-5">
        <div className="container mb-5 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Store className="text-primary h-6 w-6" />
            محصولات فروشگاه
          </h2>
          <Link
            href="/products?advertiserType=SHOP"
            className="text-primary flex items-center gap-1 text-sm hover:underline"
          >
            مشاهده همه <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
        <LibraryProductRows
          libraries={libraries}
          advertiser="SHOP"
          categoriesLoading={categoriesLoading || libraries.length === 0}
          seeAllHref={(lib) =>
            `/products?advertiserType=SHOP&libraryId=${encodeURIComponent(lib.id)}`
          }
          onSectionReady={setShopReady}
        />
      </section>

      <BadgeInfo />
    </div>
  );
}
