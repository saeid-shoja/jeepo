import type { Metadata } from 'next';
import { Suspense } from 'react';
import { buildProductsListMetadata } from '@/lib/seo';
import { ProductsPageClient } from './products-page-client';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const tab = typeof params.advertiserType === 'string' ? params.advertiserType : undefined;
  const search = typeof params.search === 'string' ? params.search : undefined;

  return buildProductsListMetadata({ tab, search });
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
