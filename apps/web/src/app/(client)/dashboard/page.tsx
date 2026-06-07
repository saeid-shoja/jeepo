'use client';

import { Heart, LogOut, Mail, MapPin, PackageSearch, Phone, ShoppingBag, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { ProfileFavoritesTab } from '@/components/profile/profile-favorites-tab';
import { ProfileMessagesTab } from '@/components/profile/profile-messages-tab';
import { ProfileProductsTab } from '@/components/profile/profile-products-tab';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import { useAuth } from '@/stores/auth-store';
import { useMessagesUnreadStore } from '@/stores/messages-unread-store';

const PROFILE_TABS = ['products', 'favorites', 'messages'] as const;
type ProfileTab = (typeof PROFILE_TABS)[number];

function isProfileTab(value: string | null): value is ProfileTab {
  return PROFILE_TABS.includes(value as ProfileTab);
}

function DashboardContent() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const unreadCount = useMessagesUnreadStore((s) => s.count);
  const refreshUnreadCount = useMessagesUnreadStore((s) => s.refresh);
  const [profile, setProfile] = useState<any>(null);

  const tabParam = searchParams.get('tab');
  const activeTab: ProfileTab = isProfileTab(tabParam) ? tabParam : 'products';

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?next=/dashboard');
      return;
    }
    if (user) {
      api.users
        .profile()
        .then(setProfile)
        .catch(() => {});
      void refreshUnreadCount();
    }
  }, [user, authLoading, router, refreshUnreadCount]);

  const handleTabChange = (value: string) => {
    if (!isProfileTab(value)) return;
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'products') {
      params.delete('tab');
    } else {
      params.set('tab', value);
    }
    const query = params.toString();
    router.replace(query ? `/dashboard?${query}` : '/dashboard');
  };

  if (authLoading) {
    return <div className="py-16 text-center text-gray-500">در حال بارگذاری...</div>;
  }

  if (!user) return null;

  return (
    <div className="container space-y-6">
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
          <Button onClick={logout} variant="destructive" size="sm">
            <LogOut className="h-4 w-4" />
            خروج
          </Button>
        </div>
        {profile && (
          <div className="mt-4 flex items-center justify-between border-t pt-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{profile._count?.products || 0}</p>
              <p className="text-xs text-gray-500">آگهی‌ها</p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Link
                href="/orders"
                className="flex items-center gap-1 rounded-sm border px-4 py-2 text-sm hover:bg-primary"
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
        )}
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="h-auto w-full flex-wrap sm:w-auto">
          <TabsTrigger value="products" className="gap-2">
            <PackageSearch className="size-4" />
            آگهی‌های من
          </TabsTrigger>
          <TabsTrigger value="favorites" className="gap-2">
            <Heart className="size-4" />
            علاقه‌مندی‌ها
          </TabsTrigger>
          <TabsTrigger value="messages" className="gap-2">
            <Mail className="size-4" />
            پیام‌ها
            {unreadCount > 0 && (
              <Badge variant="secondary" className="h-5 min-w-5 rounded-full px-1 text-[10px]">
                {unreadCount > 99 ? '99+' : unreadCount.toLocaleString('fa-IR')}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <ProfileProductsTab enabled={activeTab === 'products'} />
        </TabsContent>
        <TabsContent value="favorites">
          <ProfileFavoritesTab enabled={activeTab === 'favorites'} />
        </TabsContent>
        <TabsContent value="messages">
          <ProfileMessagesTab enabled={activeTab === 'messages'} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-gray-500">در حال بارگذاری...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
