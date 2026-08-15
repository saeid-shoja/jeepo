import { LIBRARY_CAMPING_SLUG, LIBRARY_PARTS_SLUG, MOTORCYCLE_ATV_SLUG } from '@offroad/shared';
import { getLibraryNodeHref } from '@/lib/library-links';
import type { LibraryNode } from '@/stores/categories-store';

export type HomeMainCategory = {
  id: string;
  name: string;
  slug: string;
  href: string;
  imageUrl: string;
};

type CircleSpec = {
  key: string;
  label?: string;
  librarySlug: string;
  childSlug?: string;
  imageUrl: string;
};

/**
 * Circle photos live in `public/images/categories/`.
 * Replace the files below (keep the same names) to update the homepage circles.
 */
const HOME_CIRCLE_SPECS: CircleSpec[] = [
  {
    key: 'car-sales',
    label: 'آگهی های خودرو',
    librarySlug: LIBRARY_PARTS_SLUG,
    childSlug: 'car-sales',
    imageUrl: '/images/categories/car-sales.webp',
  },
  {
    key: 'parts',
    label: 'تجهیزات آفرودی خودرو',
    librarySlug: LIBRARY_PARTS_SLUG,
    imageUrl: '/images/categories/parts.webp',
  },
  {
    key: 'motorcycle-sales',
    librarySlug: MOTORCYCLE_ATV_SLUG,
    childSlug: 'travel-offroad-motorcycle-sales',
    imageUrl: '/images/categories/motorcycle-sales.webp',
  },
  {
    key: 'motorcycle-atv',
    label: 'تجهیزات آفرودی موتورسیکلت',
    librarySlug: MOTORCYCLE_ATV_SLUG,
    imageUrl: '/images/categories/motorcycle-atv.webp',
  },
  {
    key: 'offroad-tours',
    librarySlug: LIBRARY_CAMPING_SLUG,
    childSlug: 'offroad-tours',
    imageUrl: '/images/categories/offroad-tours.webp',
  },
  {
    key: 'camping',
    label: 'تجهیزات کمپی',
    librarySlug: LIBRARY_CAMPING_SLUG,
    imageUrl: '/images/categories/camping.webp',
  },
];

function findLibraryChild(library: LibraryNode, slug: string): LibraryNode | undefined {
  return library.children.find((child) => child.slug === slug);
}

export function getHomeMainCategories(libraries: LibraryNode[]): HomeMainCategory[] {
  const items: HomeMainCategory[] = [];

  for (const spec of HOME_CIRCLE_SPECS) {
    const library = libraries.find((item) => item.slug === spec.librarySlug);
    if (!library) continue;

    if (spec.childSlug) {
      const child = findLibraryChild(library, spec.childSlug);
      if (!child) continue;
      items.push({
        id: `${spec.key}:${child.id}`,
        name: spec.label ?? child.name,
        slug: spec.key,
        href: getLibraryNodeHref(child),
        imageUrl: spec.imageUrl,
      });
      continue;
    }

    items.push({
      id: `${spec.key}:${library.id}`,
      name: spec.label ?? library.name,
      slug: spec.key,
      href: `/products?libraryId=${encodeURIComponent(library.id)}`,
      imageUrl: spec.imageUrl,
    });
  }

  return items;
}
