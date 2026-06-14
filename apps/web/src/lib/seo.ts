import {
  FAQ_ITEMS,
  SITE_DESCRIPTION,
  SITE_EMAIL,
  SITE_KEYWORDS,
  SITE_NAME_EN,
  SITE_NAME_FA,
  SITE_URL,
} from '@offroad/shared';
import type { Metadata } from 'next';
import type { ServerProduct } from './server-api';

export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || SITE_URL).replace(/\/$/, '');
}

export function toAbsoluteUrl(path: string | undefined | null): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = getSiteUrl();
  return path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
}

export const SITE_LOGO = '/logo.png';
export const FAVICON = '/favicon.ico';
export const APPLE_TOUCH_ICON = '/apple-touch-icon.png';
export const DEFAULT_OG_IMAGE = '/images/hero/s1.webp';

/** Shared icon metadata for root layout and web manifest. */
export const SITE_ICONS = {
  icon: [
    { url: FAVICON, sizes: 'any' },
    { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
  ],
  apple: [{ url: APPLE_TOUCH_ICON, sizes: '180x180', type: 'image/png' }],
  shortcut: FAVICON,
};

type BuildMetadataOptions = {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  noIndex?: boolean;
};

/** Builds page metadata with Open Graph, Twitter Card, and canonical URL (Shopify-style). */
export function buildMetadata({
  title,
  description,
  path = '',
  keywords,
  ogImage,
  ogType = 'website',
  noIndex = false,
}: BuildMetadataOptions): Metadata {
  const siteUrl = getSiteUrl();
  const canonical = `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`;
  const image = toAbsoluteUrl(ogImage || DEFAULT_OG_IMAGE);

  return {
    title,
    description,
    keywords: keywords ?? [...SITE_KEYWORDS],
    alternates: noIndex ? undefined : { canonical },
    openGraph: {
      type: ogType === 'product' ? 'website' : ogType,
      locale: 'fa_IR',
      url: canonical,
      siteName: SITE_NAME_FA,
      title,
      description,
      images: image ? [{ url: image, alt: title, width: 1200, height: 630 }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true, googleBot: { index: true, follow: true } },
  };
}

export function buildProductMetadata(product: ServerProduct): Metadata {
  const priceFormatted = Math.round(product.price).toLocaleString('fa-IR');
  const categoryName = product.category?.name ?? 'لوازم آفرود';
  const description =
    product.description?.slice(0, 155) ||
    `${product.title} — ${categoryName}${product.city ? ` در ${product.city}` : ''}. قیمت: ${priceFormatted} تومان. خرید و فروش در ${SITE_NAME_FA}.`;

  const keywords = [
    product.title,
    categoryName,
    'لوازم آفرود',
    product.city,
    product.isAuction ? 'مزایده آفرود' : undefined,
    product.type === 'SHOP' ? 'فروشگاه آفرود' : 'آگهی آفرود',
  ].filter(Boolean) as string[];

  return buildMetadata({
    title: product.title,
    description,
    path: `/product/${product.id}`,
    keywords,
    ogImage: product.images?.[0] || DEFAULT_OG_IMAGE,
    ogType: 'product',
  });
}

export function buildCategoryMetadata(name: string, slug: string): Metadata {
  return buildMetadata({
    title: `خرید و فروش ${name}`,
    description: `مشاهده و خرید ${name} — آگهی‌ها، فروشگاه و مزایده‌های ${name} در ${SITE_NAME_FA}. بهترین قیمت لوازم آفرود.`,
    path: `/category/${slug}`,
    keywords: [name, 'لوازم آفرود', `خرید ${name}`, `فروش ${name}`, SITE_NAME_FA],
  });
}

export function buildProductsListMetadata(options: {
  tab?: string;
  search?: string;
  categoryName?: string;
}): Metadata {
  const { tab, search, categoryName } = options;

  if (search) {
    return buildMetadata({
      title: `جستجو: ${search}`,
      description: `نتایج جستجو برای «${search}» — لوازم و تجهیزات آفرود در ${SITE_NAME_FA}.`,
      path: `/products?search=${encodeURIComponent(search)}`,
      keywords: [search, 'جستجوی لوازم آفرود'],
    });
  }

  if (tab === 'SHOP') {
    return buildMetadata({
      title: 'فروشگاه و آگهی های لوازم آفرودی دست دوم',
      description: `خرید آنلاین لوازم آفرودی دست دوم با قیمت پایین و تضمین فروشگاه — ${SITE_DESCRIPTION}`,
      path: '/products?advertiserType=SHOP',
      keywords: [
        'فروشگاه لوازم آفرودی',
        'خرید آنلاین لوازم آفرودی دست دوم',
        'آگهی لوازم آفرودی دست دوم',
        'تجهیزات دست دوم موتورسیکلت',
        'بی سیم و تجهیزات مسیریابی',
        'سایه بان آفرودی',
        'رینگ و لاستیک آفرودی نو و دست دوم',
        'چادرسقفی و لوازم کمپی دست دوم',
        'کیت زیربندی',
        'سوپرلیپ',
        'سپر آفرودی',
      ],
    });
  }

  if (tab === 'AUCTION') {
    return buildMetadata({
      title: 'مزایده‌ لوازم آفرودی دست دوم',
      description: `شرکت در مزایده و برگزاری مزایده لوازم آفرود دست دوم با قیمت رقابتی — ${SITE_NAME_FA}.`,
      path: '/products?advertiserType=AUCTION',
      keywords: ['مزایده آفرودی', ' مزایده لوازم آفرود دست دوم'],
    });
  }

  if (categoryName) {
    return buildMetadata({
      title: categoryName,
      description: `لیست ${categoryName} — آگهی‌ها و محصولات آفرود در ${SITE_NAME_FA}.`,
      path: '/products',
    });
  }

  return buildMetadata({
    title: `بازارچه ${SITE_NAME_FA}`,
    description: SITE_DESCRIPTION,
    path: '/products',
    keywords: [
      'فروشگاه لوازم آفرودی',
      'خرید آنلاین لوازم آفرودی دست دوم',
      'آگهی لوازم آفرودی دست دوم',
      'تجهیزات دست دوم موتورسیکلت',
      'بی سیم و تجهیزات مسیریابی',
      'سایه بان آفرودی',
      'رینگ و لاستیک آفرودی نو و دست دوم',
      'چادرسقفی و لوازم کمپی دست دوم',
      'کیت زیربندی',
      'سوپرلیپ',
      'سپر آفرودی',
    ],
  });
}

/** Schema.org Organization + WebSite with SearchAction (Google sitelinks search). */
export function buildOrganizationJsonLd() {
  const siteUrl = getSiteUrl();
  const logoUrl = toAbsoluteUrl(APPLE_TOUCH_ICON) ?? toAbsoluteUrl(SITE_LOGO);

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE_NAME_FA,
      alternateName: SITE_NAME_EN,
      url: siteUrl,
      email: SITE_EMAIL,
      description: SITE_DESCRIPTION,
      logo: {
        '@type': 'ImageObject',
        url: logoUrl,
        width: 180,
        height: 180,
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME_FA,
      url: siteUrl,
      inLanguage: 'fa-IR',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${siteUrl}/products?search={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
  ];
}

/** Schema.org Product (Shopify / WooCommerce pattern). */
export function buildProductJsonLd(product: ServerProduct) {
  const siteUrl = getSiteUrl();
  const availability =
    product.status === 'ACTIVE' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    image: product.images?.map((img) => toAbsoluteUrl(img)).filter(Boolean),
    url: `${siteUrl}/product/${product.id}`,
    category: product.category?.name,
  };

  if (product.price > 0 && !product.isAuction) {
    jsonLd.offers = {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'IRR',
      availability,
      url: `${siteUrl}/product/${product.id}`,
      seller: { '@type': 'Organization', name: SITE_NAME_FA },
    };
  }

  const breadcrumbs = [
    { '@type': 'ListItem', position: 1, name: 'خانه', item: siteUrl },
    { '@type': 'ListItem', position: 2, name: 'محصولات', item: `${siteUrl}/products` },
  ];

  if (product.category) {
    breadcrumbs.push({
      '@type': 'ListItem',
      position: 3,
      name: product.category.name,
      item: `${siteUrl}/category/${product.category.slug}`,
    });
    breadcrumbs.push({
      '@type': 'ListItem',
      position: 4,
      name: product.title,
      item: `${siteUrl}/product/${product.id}`,
    });
  } else {
    breadcrumbs.push({
      '@type': 'ListItem',
      position: 3,
      name: product.title,
      item: `${siteUrl}/product/${product.id}`,
    });
  }

  return [
    jsonLd,
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs,
    },
  ];
}

/** Schema.org WebPage for the home page. */
export function buildHomePageJsonLd() {
  const siteUrl = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${SITE_NAME_FA} | خرید و فروش تجهیزات استوک آفرودی`,
    url: siteUrl,
    description: SITE_DESCRIPTION,
    inLanguage: 'fa-IR',
    isPartOf: { '@type': 'WebSite', url: siteUrl, name: SITE_NAME_FA },
  };
}

/** Schema.org AboutPage for the about-us route. */
export function buildAboutPageJsonLd() {
  const siteUrl = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: `درباره ${SITE_NAME_FA}`,
    url: `${siteUrl}/about-us`,
    description: `آشنایی با ${SITE_NAME_FA}، ماموریت و ارزش‌های پلتفرم خرید و فروش لوازم آفرود.`,
    inLanguage: 'fa-IR',
    isPartOf: { '@type': 'WebSite', url: siteUrl, name: SITE_NAME_FA },
  };
}

/** Schema.org FAQPage for rich results. */
export function buildFaqJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

/** Schema.org ItemList for category/collection pages. */
export function buildCategoryJsonLd(name: string, slug: string, productCount?: number) {
  const siteUrl = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    url: `${siteUrl}/category/${slug}`,
    description: `خرید و فروش ${name} در ${SITE_NAME_FA}`,
    numberOfItems: productCount,
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'خانه', item: siteUrl },
        { '@type': 'ListItem', position: 2, name: 'دسته‌بندی‌ها', item: `${siteUrl}/categories` },
        { '@type': 'ListItem', position: 3, name, item: `${siteUrl}/category/${slug}` },
      ],
    },
  };
}
