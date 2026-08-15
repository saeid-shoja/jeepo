import { LIBRARY_CAMPING_SLUG } from '@offroad/shared';
import type { LibraryNode } from '@/stores/categories-store';

/** Entire libraries hidden in the shop storefront. */
const SHOP_HIDDEN_LIBRARY_SLUGS = new Set<string>([LIBRARY_CAMPING_SLUG]);

/** Category nodes hidden inside libraries (vehicle/motorcycle sales). */
const SHOP_HIDDEN_CATEGORY_SLUGS = new Set<string>([
  'car-sales',
  'travel-offroad-motorcycle-sales',
  'travel-offroad-trail-cross',
  'travel-offroad-adventure',
]);

function filterLibraryChildren(nodes: LibraryNode[]): LibraryNode[] {
  return nodes
    .filter((node) => !SHOP_HIDDEN_CATEGORY_SLUGS.has(node.slug))
    .map((node) => ({
      ...node,
      children: filterLibraryChildren(node.children),
    }));
}

/** Hide vehicle-sale nodes but keep all libraries (used on shop homepage). */
export function filterShopSaleCategories(libraries: LibraryNode[]): LibraryNode[] {
  return libraries.map((library) => ({
    ...library,
    children: filterLibraryChildren(library.children),
  }));
}

export function filterLibrariesForShop(libraries: LibraryNode[]): LibraryNode[] {
  return filterShopSaleCategories(libraries).filter(
    (library) => !SHOP_HIDDEN_LIBRARY_SLUGS.has(library.slug),
  );
}

export function filterPartsForShop<T extends { slug: string }>(parts: T[]): T[] {
  return parts.filter((part) => !SHOP_HIDDEN_CATEGORY_SLUGS.has(part.slug));
}
