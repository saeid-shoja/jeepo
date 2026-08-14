'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { ProductImage } from '@/components/shop/product-image';
import { getHomeMainCategories } from '@/lib/home-main-categories';
import { cn } from '@/lib/utils';
import { useCategoriesStore } from '@/stores/categories-store';

const CIRCLE_SKELETON_KEYS = [
  'cat-sk-1',
  'cat-sk-2',
  'cat-sk-3',
  'cat-sk-4',
  'cat-sk-5',
  'cat-sk-6',
] as const;

export function HomeCategoryCircles() {
  const libraries = useCategoriesStore((s) => s.libraries);
  const loading = useCategoriesStore((s) => s.loading);
  const categories = useMemo(() => getHomeMainCategories(libraries), [libraries]);

  if (!loading && categories.length === 0) return null;

  return (
    <section className="container py-3 sm:py-4">
      <div className="flex justify-center">
        <div className="home-strip-scrollbar max-w-full overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:none] scrollbar-thin">
          <div className="mx-auto flex w-max gap-4 px-1 sm:gap-5">
            {loading
              ? CIRCLE_SKELETON_KEYS.map((key) => (
                <div key={key} className="flex w-20 shrink-0 flex-col items-center gap-2">
                  <div className="bg-muted size-20 animate-pulse rounded-full" />
                  <div className="bg-muted h-3 w-14 animate-pulse rounded" />
                </div>
              ))
              : categories.map((category) => (
                <Link
                  key={category.id}
                  href={category.href}
                  className="group flex w-26 shrink-0 flex-col items-center gap-2"
                >
                  <span
                    className={cn(
                      'border-border bg-muted size-26 overflow-hidden rounded-full border shadow-sm',
                      'transition-transform duration-200 group-hover:scale-110',
                    )}
                  >
                    <ProductImage
                      src={category.imageUrl}
                      alt={category.name}
                      className="size-full"
                      imageClassName="object-cover"
                      sizes="80px"
                    />
                  </span>
                  <span className="text-foreground line-clamp-2 text-center text-[11px] leading-snug font-medium sm:text-xs">
                    {category.name}
                  </span>
                </Link>
              ))}
          </div>
        </div>
      </div>
    </section>
  );
}
