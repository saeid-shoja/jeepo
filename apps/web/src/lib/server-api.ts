import { type BlogPost, resolveApiBaseUrl } from '@offroad/shared';

const API_URL = resolveApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);

/** Public blog article from API (detail pages need HTML body). */
export type ServerBlogPost = BlogPost & { bodyHtml: string };

/** Server-side fetch for SEO, sitemap, and generateMetadata (no auth). */
export async function serverFetch<T>(
  endpoint: string,
  options?: { revalidate?: number | false },
): Promise<T | null> {
  try {
    const revalidate = options?.revalidate;
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...(revalidate === false
        ? { cache: 'no-store' as const }
        : { next: { revalidate: revalidate ?? 3600 } }),
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
  situation?: string | null;
  isAuction?: boolean;
  hasGuarantee?: boolean;
  purchasable?: boolean;
  city?: string;
  neighborhood?: string;
  updatedAt: string;
  createdAt: string;
  category?: { id: string; name: string; slug: string };
  carBrands?: { value: string; label: string }[];
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

export async function fetchBlogPosts(): Promise<ServerBlogPost[] | null> {
  return serverFetch<ServerBlogPost[]>('/blog/posts', { revalidate: false });
}

/** Same as fetchBlogPosts but distinguishes API failure from an empty list. */
export async function fetchBlogPostsResult(): Promise<
  { ok: true; posts: ServerBlogPost[] } | { ok: false }
> {
  const posts = await fetchBlogPosts();
  if (posts === null) return { ok: false };
  return { ok: true, posts };
}

export async function fetchBlogPost(slug: string): Promise<ServerBlogPost | null> {
  return serverFetch<ServerBlogPost>(`/blog/posts/${encodeURIComponent(slug)}`, {
    revalidate: false,
  });
}

export async function fetchBlogSlugs() {
  return serverFetch<string[]>('/blog/posts/slugs', { revalidate: false });
}
