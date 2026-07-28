'use client';

import { AlertCircle, Loader2 } from 'lucide-react';
import { LibraryCategoryTree } from '@/components/shop/library-category-tree';
import { Button } from '@/components/ui/button';
import { useCategories } from '@/stores/categories-store';

export function CategoriesPageClient() {
  const { libraries, loading, error, refetch } = useCategories();

  return (
    <div className="container space-y-10">
      <section className="space-y-6">
        <h1 className="text-2xl font-bold">دسته‌بندی‌ها</h1>

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
        ) : libraries.length > 0 ? (
          <div className="space-y-12">
            {libraries.map((library) => (
              <LibraryCategoryTree key={library.id} library={library} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground py-16 text-center">دسته‌بندی‌ای یافت نشد</p>
        )}
      </section>
    </div>
  );
}
