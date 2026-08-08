'use client';

import type { ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const STRIP_SKELETON_KEYS = ['sk-1', 'sk-2', 'sk-3', 'sk-4', 'sk-5', 'sk-6'] as const;

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
        <div className="overflow-x-auto overscroll-x-contain pb-1">
          <div className="flex w-max gap-3">
            {STRIP_SKELETON_KEYS.map((key) => (
              <Skeleton key={key} className="bg-muted h-55 w-35 shrink-0 rounded-sm sm:w-40" />
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
    <div className="overflow-x-auto overscroll-x-contain pb-2 [-ms-overflow-style:none] scrollbar-thin">
      <div className="flex w-max gap-3">
        {items.map((item) => (
          <div key={getItemKey(item)} className="md:w-35 w-50 shrink-0 sm:w-40">
            {renderItem(item)}
          </div>
        ))}
      </div>
    </div>
  );
}
