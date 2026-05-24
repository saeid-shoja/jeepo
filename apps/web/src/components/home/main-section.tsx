'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ProductCard } from '@/components/shop/product-card';
import { CategoryCard } from '@/components/shop/category-card';
import { useCategories } from '@/providers/categories-provider';
import { Store, PackageSearch, TrendingUp, Shield, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MainSection() {
  const [shopProducts, setShopProducts] = useState<any[]>([]);
  const [clientProducts, setClientProducts] = useState<any[]>([]);
  const { parts: categories, loading: categoriesLoading, error: categoriesError, refetch } =
    useCategories();

  useEffect(() => {
    api.products
      .list({ type: 'SHOP', limit: '8' })
      .then((res) => setShopProducts(res.products))
      .catch(() => setShopProducts([]));
    api.products
      .list({ type: 'CLIENT', limit: '8' })
      .then((res) => setClientProducts(res.products))
      .catch(() => setClientProducts([]));
  }, []);

  return (
    <div className="space-y-10">
      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Store className="text-primary h-6 w-6" />
            محصولات فروشگاه
          </h2>
          <Link href="/products?type=SHOP" className="text-primary text-sm hover:underline">
            مشاهده همه
          </Link>
        </div>
        {shopProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {shopProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground py-8 text-center">محصولی یافت نشد</p>
        )}
      </section>

      <section className="from-secondary/10 to-secondary/5 rounded-xl bg-gradient-to-r p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <PackageSearch className="text-secondary h-6 w-6" />
            آگهی‌های کاربران
          </h2>
          <Link href="/products" className="text-primary text-sm hover:underline">
            مشاهده همه
          </Link>
        </div>
        {clientProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {clientProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground py-8 text-center">هنوز آگهی‌ای ثبت نشده است</p>
        )}
      </section>

      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">دسته‌بندی محصولات</h2>
          <Link href="/categories" className="text-primary text-sm hover:underline">
            همه دسته‌ها
          </Link>
        </div>
        {categoriesLoading ? (
          <p className="text-muted-foreground py-8 text-center">در حال بارگذاری دسته‌بندی‌ها...</p>
        ) : categoriesError ? (
          <div className="border-destructive/30 bg-destructive/5 flex flex-col items-center gap-3 rounded-xl border p-6 text-center">
            <AlertCircle className="text-destructive h-8 w-8" />
            <p className="text-destructive text-sm">{categoriesError}</p>
            <p className="text-muted-foreground text-xs">
              مطمئن شوید API روی{' '}
              <code className="bg-muted rounded px-1">http://localhost:4000</code> در حال اجراست،
              سپس دوباره تلاش کنید.
            </p>
            <Button variant="outline" size="sm" onClick={refetch}>
              تلاش مجدد
            </Button>
          </div>
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
            {categories.map((cat) => (
              <CategoryCard key={cat.id} category={cat} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground py-8 text-center">دسته‌بندی‌ای یافت نشد</p>
        )}
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="bg-card flex items-start gap-4 rounded-xl border p-6">
          <Shield className="text-primary h-10 w-10" />
          <div>
            <h3 className="font-bold">با تضمین فروشگاه</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              محصولات دارای نشان تضمین، اصالت کالا را از فروشگاه ما دارند
            </p>
          </div>
        </div>
        <div className="bg-card flex items-start gap-4 rounded-xl border p-6">
          <TrendingUp className="text-secondary h-10 w-10" />
          <div>
            <h3 className="font-bold">پله شده</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              با فعال‌سازی گزینه پله، آگهی شما در بالای لیست نمایش داده می‌شود
            </p>
          </div>
        </div>
        <div className="bg-card flex items-start gap-4 rounded-xl border p-6">
          <PackageSearch className="text-accent h-10 w-10" />
          <div>
            <h3 className="font-bold">خرید و فروش آسان</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              مانند دیوار، آگهی خود را ثبت کنید و محصولتان را بفروشید
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
