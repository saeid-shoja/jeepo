import { CATEGORIES } from '@offroad/shared';
import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/seo';
import {
  fetchBlogPosts,
  fetchCategoriesForSitemap,
  fetchProductsForSitemap,
} from '@/lib/server-api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/products`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${baseUrl}/categories`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/about-us`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/roles`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = CATEGORIES.map((cat) => ({
    url: `${baseUrl}/category/${cat.slug}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));

  const categoriesData = await fetchCategoriesForSitemap();
  const apiCategoryRoutes: MetadataRoute.Sitemap =
    categoriesData?.parts
      ?.filter((c) => !CATEGORIES.some((d) => d.slug === c.slug))
      .map((cat) => ({
        url: `${baseUrl}/category/${cat.slug}`,
        lastModified: now,
        changeFrequency: 'daily' as const,
        priority: 0.7,
      })) ?? [];

  const productsData = await fetchProductsForSitemap(1000);
  const productRoutes: MetadataRoute.Sitemap =
    productsData?.products?.map((product) => ({
      url: `${baseUrl}/product/${product.id}`,
      lastModified: new Date(product.updatedAt || product.createdAt),
      changeFrequency: 'weekly' as const,
      priority: product.type === 'SHOP' ? 0.8 : 0.65,
    })) ?? [];

  const blogPosts = (await fetchBlogPosts()) ?? [];
  const blogRoutes: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.publishedAt ? new Date(post.publishedAt) : now,
    changeFrequency: 'monthly' as const,
    priority: 0.55,
  }));

  return [
    ...staticRoutes,
    ...categoryRoutes,
    ...apiCategoryRoutes,
    ...productRoutes,
    ...blogRoutes,
  ];
}
