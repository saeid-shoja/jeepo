import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import { CategoriesPageClient } from './categories-page-client';

export const metadata: Metadata = buildMetadata({
  title: 'دسته‌بندی لوازم آفرود',
  description:
    'مرور دسته‌بندی‌های لوازم آفرود — کمک فنر، لاستیک، چراغ، اکسسوری، موتور و ATV و برند خودرو.',
  path: '/categories',
  keywords: ['دسته‌بندی آفرود', 'دسته‌بندی لوازم آفرود', 'قطعات آفرود'],
});

export default function CategoriesPage() {
  return <CategoriesPageClient />;
}
