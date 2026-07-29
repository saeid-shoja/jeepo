'use client';

import { Bookmark } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/stores/auth-store';
import { useFavoritesStore } from '@/stores/favorites-store';

type FavoriteButtonProps = {
  productId: string;
  className?: string;
};

export function FavoriteButton({ productId, className }: FavoriteButtonProps) {
  const router = useRouter();
  const { user } = useAuth();
  const isFavorite = useFavoritesStore((s) => Boolean(s.ids[productId]));
  const toggle = useFavoritesStore((s) => s.toggle);
  const [pending, setPending] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      router.push('/login');
      return;
    }

    if (pending) return;

    setPending(true);
    try {
      const added = await toggle(productId);
      toast.success(added ? 'ذخیره شد' : 'از ذخیره‌ها حذف شد');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'خطا در به‌روزرسانی ذخیره‌ها');
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      aria-label={isFavorite ? 'حذف از ذخیره‌ها' : 'ذخیره کردن'}
      aria-pressed={isFavorite}
      disabled={pending}
      onClick={handleClick}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-full bg-background/90 shadow-sm backdrop-blur transition-colors hover:bg-background',
        pending && 'opacity-70',
        className,
      )}
    >
      <Bookmark
        className={cn(
          'h-4 w-4 transition-colors',
          isFavorite ? 'fill-primary text-primary' : 'text-muted-foreground hover:text-primary',
        )}
      />
    </button>
  );
}
