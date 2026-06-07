'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ProductCard } from '@/components/shop/product-card';
import { api } from '@/lib/api';
import { useCategories } from '@/stores/categories-store';

export function CategoryPageClient() {
  const { slug } = useParams<{ slug: string }>();
  const { parts, loading: categoriesLoading } = useCategories();
  const [products, setProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  const category = parts.find((c) => c.slug === slug);

  useEffect(() => {
    if (!category) {
      setProductsLoading(false);
      return;
    }
    setProductsLoading(true);
    api.products
      .list({ categoryId: category.id, limit: '50' })
      .then((res) => setProducts(res.products))
      .catch(() => setProducts([]))
      .finally(() => setProductsLoading(false));
  }, [category]);

  if (categoriesLoading || productsLoading) {
    return <div className="text-muted-foreground py-16 text-center">در حال بارگذاری...</div>;
  }

  if (!category) {
    return <div className="text-muted-foreground py-16 text-center">دسته‌بندی یافت نشد</div>;
  }

  return (
    <div className="space-y-6 container">
      <h1 className="text-2xl font-bold">{category.name}</h1>
      {products.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground py-16 text-center">محصولی در این دسته‌بندی یافت نشد</p>
      )}
    </div>
  );
}
