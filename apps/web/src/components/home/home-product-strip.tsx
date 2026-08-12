'use client';

import type { ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const STRIP_SKELETON_KEYS = [
  'sk-1',
  'sk-2',
  'sk-3',
  'sk-4',
  'sk-5',
  'sk-6',
  'sk-7',
  'sk-8',
] as const;

type HomeProductStripProps<T> = {
  loading: boolean;
  items: T[];
  emptyMessage: string;
  renderItem: (item: T) => ReactNode;
  getItemKey: (item: T) => string;
};

export function HomeProductStrip<T>({
  loading,
  items,
  emptyMessage,
  renderItem,
  getItemKey,
}: HomeProductStripProps<T>) {
  if (loading) {
    return (
      <div className="space-y-3">
        <div className="home-strip-scrollbar overflow-x-auto overscroll-x-contain pb-1">
          <div className="flex w-max gap-3">
            {STRIP_SKELETON_KEYS.map((key) => (
              <Skeleton key={key} className="bg-muted h-55 shrink-0 rounded-sm w-50 md:w-45" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return <p className="text-muted-foreground py-8 text-center">{emptyMessage}</p>;
  }

  return (
    <div className="home-strip-scrollbar overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:none] scrollbar-thin">
      <div className="flex w-max gap-3">
        {items.map((item) => (
          <div key={getItemKey(item)} className="w-50 shrink-0 md:w-45">
            {renderItem(item)}
          </div>
        ))}
      </div>
    </div>
  );
}
