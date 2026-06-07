import { CATEGORIES } from '@offroad/shared';
import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/json-ld';
import { buildCategoryJsonLd, buildCategoryMetadata, buildMetadata } from '@/lib/seo';
import { fetchCategoriesForSitemap } from '@/lib/server-api';
import { CategoryPageClient } from './category-page-client';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const staticCategory = CATEGORIES.find((c) => c.slug === slug);

  if (staticCategory) {
    return buildCategoryMetadata(staticCategory.name, slug);
  }

  const categoriesData = await fetchCategoriesForSitemap();
  const apiCategory = categoriesData?.parts?.find((c) => c.slug === slug);

  if (apiCategory) {
    return buildCategoryMetadata(apiCategory.name, slug);
  }

  return buildMetadata({
    title: 'دسته‌بندی',
    description: 'مشاهده محصولات این دسته‌بندی در جیپو.',
    path: `/category/${slug}`,
  });
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const staticCategory = CATEGORIES.find((c) => c.slug === slug);
  let name = staticCategory?.name ?? slug;

  if (!staticCategory) {
    const categoriesData = await fetchCategoriesForSitemap();
    const apiCategory = categoriesData?.parts?.find((c) => c.slug === slug);
    if (apiCategory) name = apiCategory.name;
  }

  return (
    <>
      <JsonLd data={buildCategoryJsonLd(name, slug)} />
      <CategoryPageClient />
    </>
  );
}
