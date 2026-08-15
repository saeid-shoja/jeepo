'use client';

import { ArrowLeft, PackageSearch, Store } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { HomeProductStrip } from '@/components/home/home-product-strip';
import { ProductCard } from '@/components/shop/product-card';
import { api } from '@/lib/api';
import { useRestoreListScroll } from '@/lib/use-restore-list-scroll';
import { type LibraryNode, useCategories } from '@/stores/categories-store';
import BadgeInfo from './badge-info';

const HOME_SECTION_LIMIT = '10';
const LIBRARY_SKELETON_KEYS = ['lib-sk-1', 'lib-sk-2', 'lib-sk-3', 'lib-sk-4'] as const;

type LibraryStripState = {
  items: any[];
  loading: boolean;
};

type AdvertiserKey = 'CLIENT' | 'SHOP';

function emptyStripMap(libraries: LibraryNode[]): Record<string, LibraryStripState> {
  return Object.fromEntries(libraries.map((lib) => [lib.id, { items: [], loading: true }]));
}

async function fetchLibraryProducts(advertiser: AdvertiserKey, libraryId: string) {
  try {
    const res = await api.products.list({
      advertiser,
      libraryId,
      limit: HOME_SECTION_LIMIT,
    });
    return res.products ?? [];
  } catch {
    return [];
  }
}

function LibraryProductRows({
  libraries,
  strips,
  categoriesLoading,
  seeAllHref,
}: {
  libraries: LibraryNode[];
  strips: Record<string, LibraryStripState>;
  categoriesLoading: boolean;
  seeAllHref: (library: LibraryNode) => string;
}) {
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

  const visible = libraries.filter((lib) => {
    const strip = strips[lib.id];
    if (!strip) return false;
    return strip.loading || strip.items.length > 0;
  });

  const allSettled = libraries.every((lib) => strips[lib.id] && !strips[lib.id].loading);
  const anyVisible = visible.some((lib) => (strips[lib.id]?.items.length ?? 0) > 0);

  if (allSettled && !anyVisible) {
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
      {visible.map((lib) => {
        const strip = strips[lib.id] ?? { items: [], loading: true };
        return (
          <div
            key={lib.id}
            className="rounded-2xl border border-border/70 bg-card/70 p-4 shadow-sm sm:p-5"
          >
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-semibold sm:text-lg">{lib.name}</h3>
              <Link
                href={seeAllHref(lib)}
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
  );
}

export default function MainSection() {
  const { libraries, loading: categoriesLoading } = useCategories();
  const [clientStrips, setClientStrips] = useState<Record<string, LibraryStripState>>({});
  const [shopStrips, setShopStrips] = useState<Record<string, LibraryStripState>>({});

  useEffect(() => {
    if (categoriesLoading || libraries.length === 0) return;

    setClientStrips(emptyStripMap(libraries));
    setShopStrips(emptyStripMap(libraries));

    let cancelled = false;

    void (async () => {
      await Promise.all(
        libraries.map(async (lib) => {
          const [clientItems, shopItems] = await Promise.all([
            fetchLibraryProducts('CLIENT', lib.id),
            fetchLibraryProducts('SHOP', lib.id),
          ]);
          if (cancelled) return;
          setClientStrips((prev) => ({
            ...prev,
            [lib.id]: { items: clientItems, loading: false },
          }));
          setShopStrips((prev) => ({
            ...prev,
            [lib.id]: { items: shopItems, loading: false },
          }));
        }),
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [categoriesLoading, libraries]);

  const clientReady =
    !categoriesLoading &&
    libraries.length > 0 &&
    libraries.every((lib) => clientStrips[lib.id] && !clientStrips[lib.id].loading);
  const shopReady =
    !categoriesLoading &&
    libraries.length > 0 &&
    libraries.every((lib) => shopStrips[lib.id] && !shopStrips[lib.id].loading);

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
          strips={clientStrips}
          categoriesLoading={categoriesLoading || libraries.length === 0}
          seeAllHref={(lib) => `/products?libraryId=${encodeURIComponent(lib.id)}`}
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
          strips={shopStrips}
          categoriesLoading={categoriesLoading || libraries.length === 0}
          seeAllHref={(lib) =>
            `/products?advertiserType=SHOP&libraryId=${encodeURIComponent(lib.id)}`
          }
        />
      </section>

      <BadgeInfo />
    </div>
  );
}
