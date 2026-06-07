'use client';

import { getCarBrandLabel, isCarBrand, MOTORCYCLE_ATV_SLUG } from '@offroad/shared';
import { AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { CategoryCard } from '@/components/shop/category-card';
import { Button } from '@/components/ui/button';
import { getLibraryNodeHref } from '@/lib/library-links';
import { useCategories } from '@/stores/categories-store';

export function CategoriesPageClient() {
  const { libraries, loading, error, refetch } = useCategories();

  const partsLib = libraries.find((l) => l.slug === 'parts');
  const motorcycleLib = libraries.find((l) => l.slug === MOTORCYCLE_ATV_SLUG);
  const brandsLib = libraries.find((l) => l.slug === 'car-brands');

  return (
    <div className="space-y-10 container">
      <section className="space-y-6">
        <h1 className="text-2xl font-bold">دسته بندی ها</h1>

        {loading ? (
          <div className="text-muted-foreground flex items-center justify-center gap-2 py-16">
            <Loader2 className="size-5 animate-spin" />
            در حال بارگذاری...
          </div>
        ) : error ? (
          <div className="border-destructive/30 bg-destructive/5 flex flex-col items-center gap-3 rounded-lg border p-8 text-center">
            <AlertCircle className="text-destructive h-10 w-10" />
            <p className="text-destructive">{error}</p>
            <Button variant="outline" onClick={refetch}>
              تلاش مجدد
            </Button>
          </div>
        ) : (
          <>
            {partsLib && (
              <div className="space-y-8">
                <h2 className="text-xl font-bold">{partsLib.name}</h2>
                {partsLib.children.map((group) => (
                  <div key={group.id} className="space-y-4">
                    <h3 className="text-muted-foreground text-sm font-semibold">{group.name}</h3>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
                      {group.children.length > 0 ? (
                        group.children.map((sub) => (
                          <CategoryCard
                            key={sub.id}
                            category={{ id: sub.id, name: sub.name, slug: sub.slug }}
                          />
                        ))
                      ) : (
                        <CategoryCard
                          category={{ id: group.id, name: group.name, slug: group.slug }}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {motorcycleLib && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold">{motorcycleLib.name}</h2>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
                  {motorcycleLib.children.map((item) => (
                    <CategoryCard
                      key={item.id}
                      category={{ id: item.id, name: item.name, slug: item.slug }}
                    />
                  ))}
                </div>
              </div>
            )}

            {brandsLib && brandsLib.children.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold">{brandsLib.name}</h2>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
                  {brandsLib.children.map((brand) => (
                    <Link
                      key={brand.id}
                      href={getLibraryNodeHref(brand)}
                      className="bg-card hover:border-primary flex flex-col items-center justify-center rounded-lg border p-4 text-center transition"
                    >
                      <span className="text-sm font-medium">
                        {isCarBrand(brand.id) ? getCarBrandLabel(brand.id) : brand.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
