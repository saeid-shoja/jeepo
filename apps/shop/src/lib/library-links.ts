import type { LibraryNode } from '@/stores/categories-store';

export function getLibraryNodeHref(node: LibraryNode): string {
  if (node.kind === 'CAR_BRAND') {
    return `/products?carBrand=${encodeURIComponent(node.id)}`;
  }
  return `/category/${node.slug}`;
}
