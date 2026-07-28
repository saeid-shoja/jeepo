'use client';

import Link from 'next/link';

interface CategoryCardProps {
  category: any;
}

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link
      href={`/category/${category.slug}`}
      className="bg-card hover:border-primary flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-all hover:text-primary"
    >
      <span className="text-sm font-medium">{category.name}</span>
      {category._count && (
        <span className="text-muted-foreground text-xs">{category._count.products} محصول</span>
      )}
    </Link>
  );
}
