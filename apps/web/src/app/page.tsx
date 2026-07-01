import { SITE_DESCRIPTION } from '@offroad/shared';
import type { Metadata } from 'next';
import { HeroSlider } from '@/components/home/hero';
import MainSection from '@/components/home/main-section';
import { JsonLd } from '@/components/seo/json-ld';
import { buildHomePageJsonLd, buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: `خرید و فروش تجهیزات استوک آفرودی`,
  description: SITE_DESCRIPTION,
  path: '/',
});

export default function HomePage() {
  return (
    <>
      <JsonLd data={buildHomePageJsonLd()} />
      <section className="sr-only">
        <h1>خرید و فروش لوازم آفرود نو و دست دوم در جیپو</h1>
        <p>
          جیپو بازار تخصصی تجهیزات آفرود است و کاربران می‌توانند آگهی ثبت کنند، قیمت‌ها را مقایسه کنند
          و برای خرید امن‌تر تصمیم بگیرند. اگر کاربران از دیوار، شیپور، ترب یا دودف برای جستجو
          استفاده می‌کنند، در جیپو نتایج تخصصی‌تر لوازم آفرودی می‌بینند.
        </p>
      </section>
      <div className="relative -mx-4 -mt-12 mb-4">
        <HeroSlider />
      </div>
      <MainSection />
    </>
  );
}
