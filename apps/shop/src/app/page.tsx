import { SITE_DESCRIPTION, SITE_NAME_FA } from '@offroad/shared';
import type { Metadata } from 'next';
import { HeroSlider } from '@/components/home/hero';
import { HomeCategoryCircles } from '@/components/home/home-category-circles';
import MainSection from '@/components/home/main-section';
import { JsonLd } from '@/components/seo/json-ld';
import { buildHomePageJsonLd, buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: `فروشگاه آنلاین لوازم آفرودی`,
  description: `خرید آنلاین لوازم و قطعات آفرودی از فروشگاه ${SITE_NAME_FA}. ${SITE_DESCRIPTION}`,
  path: '/',
});

export default function HomePage() {
  return (
    <>
      <JsonLd data={buildHomePageJsonLd()} />
      <section className="sr-only">
        <h1>فروشگاه آنلاین لوازم آفرودی {SITE_NAME_FA}</h1>
        <p>
          خرید آنلاین قطعات و تجهیزات آفرودی با ارسال به سراسر ایران. مناسب معرفی در ترب و سایر
          پلتفرم‌های مقایسه قیمت.
        </p>
      </section>
      <div className="relative -mx-4 -mt-12 mb-4">
        <HeroSlider />
      </div>
      <HomeCategoryCircles />
      <MainSection />
    </>
  );
}
