'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
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

type CategoriesContextValue = {
  parts: PartCategory[];
  /** Leaf part categories (subgroups) — for product forms */
  partLeaves: PartCategory[];
  carBrands: CarBrandOption[];
  libraries: LibraryNode[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

const CategoriesContext = createContext<CategoriesContextValue | null>(null);

export function CategoriesProvider({ children }: { children: React.ReactNode }) {
  const [parts, setParts] = useState<PartCategory[]>([]);
  const [carBrands, setCarBrands] = useState<CarBrandOption[]>([]);
  const [libraries, setLibraries] = useState<LibraryNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.categories.list();
      setParts(res.parts ?? []);
      setCarBrands(res.carBrands ?? []);
      setLibraries((res.libraries ?? []) as LibraryNode[]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'خطا در بارگذاری دسته‌بندی‌ها';
      setError(message);
      setParts([]);
      setCarBrands([]);
      setLibraries([]);
      if (process.env.NODE_ENV === 'development') {
        console.error('[categories]', message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const partLeaves = useMemo(
    () => parts.filter((cat) => !parts.some((p) => p.parentId === cat.id)),
    [parts],
  );

  const value = useMemo(
    () => ({ parts, partLeaves, carBrands, libraries, loading, error, refetch: load }),
    [parts, partLeaves, carBrands, libraries, loading, error, load],
  );

  return (
    <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>
  );
}

export function useCategories() {
  const ctx = useContext(CategoriesContext);
  if (!ctx) {
    throw new Error('useCategories must be used within CategoriesProvider');
  }
  return ctx;
}
