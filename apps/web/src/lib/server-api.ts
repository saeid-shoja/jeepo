const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

/** Server-side fetch for SEO, sitemap, and generateMetadata (no auth). */
export async function serverFetch<T>(
  endpoint: string,
  options?: { revalidate?: number | false },
): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      next: { revalidate: options?.revalidate ?? 3600 },
    });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

export type ServerProduct = {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  status: string;
  type: string;
  isAuction?: boolean;
  city?: string;
  updatedAt: string;
  createdAt: string;
  category?: { id: string; name: string; slug: string };
};

export type ServerCategory = {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
};

export async function fetchProduct(id: string) {
  return serverFetch<ServerProduct>(`/products/${id}`, { revalidate: 1800 });
}

export async function fetchProductsForSitemap(limit = 500) {
  return serverFetch<{ products: ServerProduct[] }>(
    `/products?limit=${limit}&page=1&advertiser=CLIENT`,
    { revalidate: 3600 },
  );
}

export async function fetchCategoriesForSitemap() {
  return serverFetch<{ parts: ServerCategory[] }>('/categories', { revalidate: 86400 });
}
