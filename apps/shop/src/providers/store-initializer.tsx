'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useCategoriesStore } from '@/stores/categories-store';

/** Runs once on app mount to hydrate auth and load categories */
export function StoreInitializer() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const fetchCategories = useCategoriesStore((s) => s.fetch);

  useEffect(() => {
    void hydrate();
    void fetchCategories();
  }, [hydrate, fetchCategories]);

  return null;
}
