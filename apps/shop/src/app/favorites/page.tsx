'use client';

import { usePathname } from 'next/navigation';
import { AuthPrompt } from '@/components/auth/auth-prompt';
import { ProfileFavoritesTab } from '@/components/profile/profile-favorites-tab';
import { useAuth } from '@/stores/auth-store';

export default function FavoritesPage() {
  const { user, loading: authLoading } = useAuth();
  const pathname = usePathname();

  if (authLoading) {
    return <div className="text-muted-foreground py-16 text-center">در حال بارگذاری...</div>;
  }

  if (!user) {
    return (
      <div className="container py-8">
        <AuthPrompt
          title="برای مشاهده علاقه‌مندی‌ها وارد شوید"
          description="می‌توانید با همان حساب سایت اصلی وارد شوید یا ثبت‌نام کنید."
          nextPath={pathname}
        />
      </div>
    );
  }

  return (
    <div className="container space-y-6">
      <h1 className="text-2xl font-bold">علاقه‌مندی‌ها</h1>
      <ProfileFavoritesTab enabled />
    </div>
  );
}
