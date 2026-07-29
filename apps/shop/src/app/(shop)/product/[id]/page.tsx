import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/json-ld';
import { buildProductJsonLd, buildProductMetadata } from '@/lib/seo';
import { fetchProduct } from '@/lib/server-api';
import { ProductDetailClient } from './product-detail-client';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await fetchProduct(id);

  if (!product) {
    return { title: 'محصول یافت نشد' };
  }

  return buildProductMetadata(product);
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const product = await fetchProduct(id);

  return (
    <>
      {product && <JsonLd data={buildProductJsonLd(product)} />}
      <ProductDetailClient />
    </>
  );
}
