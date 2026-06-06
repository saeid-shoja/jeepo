'use client';

import { useMemo } from 'react';
import { toast } from 'sonner';
import { create } from 'zustand';
import { api } from '@/lib/api';

export type PartCategory = {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  _count?: { products: number };
};

export type CarBrandOption = {
  value: string;
  label: string;
};

export type LibraryNode = {
  id: string;
  name: string;
  slug: string;
  kind: 'PART' | 'CAR_BRAND';
  children: LibraryNode[];
};

type CategoriesState = {
  parts: PartCategory[];
  carBrands: CarBrandOption[];
  libraries: LibraryNode[];
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
};

export const useCategoriesStore = create<CategoriesState>((set) => ({
  parts: [],
  carBrands: [],
  libraries: [],
  loading: true,
  error: null,

  fetch: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.categories.list();
      set({
        parts: res.parts ?? [],
        carBrands: res.carBrands ?? [],
        libraries: (res.libraries ?? []) as LibraryNode[],
        loading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'خطا در بارگذاری دسته‌بندی‌ها';
      toast.error(message);
      set({
        parts: [],
        carBrands: [],
        libraries: [],
        error: message,
        loading: false,
      });
    }
  },
}));

/** Convenience hook with derived partLeaves */
export function useCategories() {
  const parts = useCategoriesStore((s) => s.parts);
  const carBrands = useCategoriesStore((s) => s.carBrands);
  const libraries = useCategoriesStore((s) => s.libraries);
  const loading = useCategoriesStore((s) => s.loading);
  const error = useCategoriesStore((s) => s.error);
  const fetch = useCategoriesStore((s) => s.fetch);

  const partLeaves = useMemo(
    () => parts.filter((cat) => !parts.some((p) => p.parentId === cat.id)),
    [parts],
  );

  return {
    parts,
    partLeaves,
    carBrands,
    libraries,
    loading,
    error,
    refetch: fetch,
  };
}
