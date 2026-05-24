'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { ProductCard } from '@/components/shop/product-card';
import { PackageSearch, User, Phone, MapPin, LogOut } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      api.users.profile().then(setProfile).catch(() => { });
      api.users.products().then(setProducts).catch(() => { });
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return <div className="py-16 text-center text-gray-500">در حال بارگذاری...</div>;
  }

  if (!user) return null;

  return (
    <div className="space-y-8">
      <div className="rounded-xl border bg-white p-6">
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
            onClick={logout}
            className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
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
        <Link
          href="/products/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm text-white hover:bg-primary-dark"
        >
          ثبت آگهی جدید
        </Link>
      </div>

      {products.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-gray-300 py-16 text-center">
          <PackageSearch className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500">هنوز آگهی ثبت نکرده‌اید</p>
          <Link
            href="/products/new"
            className="mt-4 inline-block rounded-lg bg-primary px-6 py-2 text-sm text-white hover:bg-primary-dark"
          >
            ثبت اولین آگهی
          </Link>
        </div>
      )}
    </div>
  );
}
