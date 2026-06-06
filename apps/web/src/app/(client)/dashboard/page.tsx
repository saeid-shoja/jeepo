'use client';

import { Heart, LogOut, Mail, MapPin, PackageSearch, Phone, RefreshCw, ShoppingBag, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ProductCard } from '@/components/shop/product-card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useAuth } from '@/stores/auth-store';

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [reactivatingId, setReactivatingId] = useState<string | null>(null);

  const loadProducts = useCallback(() => {
    return api.users.products().then(setProducts).catch(() => setProducts([]));
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      api.users
        .profile()
        .then(setProfile)
        .catch(() => { });
      void loadProducts();
    }
  }, [user, authLoading, router, loadProducts]);

  const handleReactivate = async (productId: string) => {
    setReactivatingId(productId);
    try {
      await api.products.reactivate(productId);
      toast.success('آگهی با موفقیت فعال شد');
      await loadProducts();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'فعال‌سازی آگهی ناموفق بود');
    } finally {
      setReactivatingId(null);
    }
  };

  if (authLoading) {
    return <div className="py-16 text-center text-gray-500">در حال بارگذاری...</div>;
  }

  if (!user) return null;

  return (
    <div className="space-y-8 container">
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{profile?.name || user.name}</h1>
            <p className="flex items-center gap-1 text-sm text-gray-500">
              <Phone className="h-3 w-3" />
              {user.phone}
            </p>
            {profile?.city && (
              <p className="flex items-center gap-1 text-sm text-gray-500">
                <MapPin className="h-3 w-3" />
                {profile.city}
              </p>
            )}
          </div>
          <button
            type='button'
            onClick={logout}
            className="flex items-center gap-1 rounded-sm border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            خروج
          </button>
        </div>
        {profile && (
          <div className="mt-4 grid grid-cols-3 gap-4 border-t pt-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{profile._count?.products || 0}</p>
              <p className="text-xs text-gray-500">آگهی‌ها</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <PackageSearch className="h-5 w-5 text-primary" />
          آگهی‌های من
        </h2>
        <div className="flex gap-2">
          <Link
            href="/favorites"
            className="flex items-center gap-1 rounded-sm border px-4 py-2 text-sm hover:bg-gray-50"
          >
            <Heart className="h-4 w-4" />
            علاقه‌مندی‌ها
          </Link>
          <Link
            href="/messages"
            className="flex items-center gap-1 rounded-sm border px-4 py-2 text-sm hover:bg-gray-50"
          >
            <Mail className="h-4 w-4" />
            پیام‌ها
          </Link>
          <Link
            href="/orders"
            className="flex items-center gap-1 rounded-sm border px-4 py-2 text-sm hover:bg-gray-50"
          >
            <ShoppingBag className="h-4 w-4" />
            سفارش‌های من
          </Link>
          <Link
            href="/products/new"
            className="rounded-sm bg-primary px-4 py-2 text-sm text-white hover:bg-primary-dark"
          >
            ثبت آگهی جدید
          </Link>
        </div>
      </div>

      {products.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product: any) => (
            <div key={product.id} className="flex flex-col gap-2">
              <ProductCard product={product} />
              {product.status === 'DEPRECATED' && (
                <div className="space-y-1 px-1">
                  {product.deletionAt && (
                    <p className="text-muted-foreground text-center text-[10px]">
                      حذف خودکار:{' '}
                      {new Date(product.deletionAt).toLocaleDateString('fa-IR')}
                    </p>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full gap-1"
                    disabled={reactivatingId === product.id}
                    onClick={() => handleReactivate(product.id)}
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 ${reactivatingId === product.id ? 'animate-spin' : ''}`}
                    />
                    فعال‌سازی مجدد
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border-2 border-dashed border-gray-300 py-16 text-center">
          <PackageSearch className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500">هنوز آگهی ثبت نکرده‌اید</p>
          <Link
            href="/products/new"
            className="mt-4 inline-block rounded-sm bg-primary px-6 py-2 text-sm text-white hover:bg-primary-dark"
          >
            ثبت اولین آگهی
          </Link>
        </div>
      )}
    </div>
  );
}
