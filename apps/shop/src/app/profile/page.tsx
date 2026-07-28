'use client';

import { Heart, LogOut, MapPin, Phone, ShoppingBag, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { AuthPrompt } from '@/components/auth/auth-prompt';
import { ProfileEditDialog } from '@/components/profile/profile-edit-dialog';
import { ProfileFavoritesTab } from '@/components/profile/profile-favorites-tab';
import { TelegramNotificationsCard } from '@/components/profile/telegram-notifications-card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import { useAuth } from '@/stores/auth-store';

const PROFILE_TABS = ['favorites'] as const;
type ProfileTab = (typeof PROFILE_TABS)[number];

function isProfileTab(value: string | null): value is ProfileTab {
  return PROFILE_TABS.includes(value as ProfileTab);
}

function ProfileContent() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<any>(null);

  const refreshProfile = useCallback(() => {
    return api.users
      .profile()
      .then(setProfile)
      .catch(() => {});
  }, []);

  const tabParam = searchParams.get('tab');
  const activeTab: ProfileTab = isProfileTab(tabParam) ? tabParam : 'favorites';

  useEffect(() => {
    if (user) {
      void refreshProfile();
    }
  }, [user, refreshProfile]);

  const handleTabChange = (value: string) => {
    if (!isProfileTab(value)) return;
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'favorites') {
      params.delete('tab');
    } else {
      params.set('tab', value);
    }
    const query = params.toString();
    router.replace(query ? `/profile?${query}` : '/profile');
  };

  if (authLoading) {
    return <div className="text-muted-foreground py-16 text-center">در حال بارگذاری...</div>;
  }

  if (!user) {
    return (
      <div className="container py-8">
        <AuthPrompt
          title="برای مشاهده پروفایل وارد شوید"
          description="با همان حساب سایت اصلی جیپو می‌توانید وارد شوید."
          nextPath="/profile"
        />
      </div>
    );
  }

  return (
    <div className="container space-y-6">
      <div className="rounded-lg border bg-card p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary lg:h-16 lg:w-16">
            <User className="h-5 w-5 lg:h-8 lg:w-8" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-bold lg:text-xl">{profile?.name || user.name}</h1>
            <p className="flex items-center gap-1 text-xs text-gray-500 lg:text-sm">
              <Phone className="h-3 w-3" />
              {user.phone}
            </p>
            {profile?.city && (
              <p className="flex items-center gap-1 text-xs text-gray-500 lg:text-sm">
                <MapPin className="h-3 w-3" />
                {profile.city}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <ProfileEditDialog
              profile={profile}
              onUpdated={(updated) => setProfile((prev: any) => ({ ...prev, ...updated }))}
            />
            <Button onClick={logout} variant="destructive" size="sm">
              <LogOut className="h-4 w-4" />
              <span className="hidden lg:inline">خروج</span>
            </Button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-3">
          <Link
            href="/orders"
            className="hover:bg-primary flex items-center gap-1 rounded-sm border px-2.5 py-2 text-sm"
          >
            <ShoppingBag className="h-4 w-4" />
            سفارش‌های من
          </Link>
        </div>
      </div>

      <TelegramNotificationsCard />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList>
          <TabsTrigger value="favorites" className="gap-2">
            <Heart className="size-4" />
            علاقه‌مندی‌ها
          </TabsTrigger>
        </TabsList>
        <TabsContent value="favorites">
          <ProfileFavoritesTab enabled={activeTab === 'favorites'} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={<div className="text-muted-foreground py-16 text-center">در حال بارگذاری...</div>}
    >
      <ProfileContent />
    </Suspense>
  );
}
