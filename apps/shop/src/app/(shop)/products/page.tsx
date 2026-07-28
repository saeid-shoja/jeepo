import type { Metadata } from 'next';
import { Suspense } from 'react';
import { buildMetadata } from '@/lib/seo';
import { ProductsPageClient } from './products-page-client';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const search = typeof params.search === 'string' ? params.search : undefined;

  if (search) {
    return buildMetadata({
      title: `جستجو: ${search}`,
      description: `نتایج جستجو برای «${search}» در فروشگاه جیپو`,
      path: `/products?search=${encodeURIComponent(search)}`,
    });
  }

  return buildMetadata({
    title: 'محصولات فروشگاه',
    description: 'لیست محصولات فروشگاه جیپو — لوازم و قطعات آفرودی',
    path: '/products',
  });
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={<div className="text-muted-foreground py-16 text-center">در حال بارگذاری...</div>}
    >
      <ProductsPageClient />
    </Suspense>
  );
}
