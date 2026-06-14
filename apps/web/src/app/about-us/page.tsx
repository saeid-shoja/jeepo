import { ABOUT_US_BLOCKS, SITE_NAME_FA, type SiteContentBlock } from '@offroad/shared';
import type { Metadata } from 'next';
import { SiteLogo } from '@/components/layout/site-logo';
import { JsonLd } from '@/components/seo/json-ld';
import { buildAboutPageJsonLd, buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'درباره ما',
  description: `آشنایی با ${SITE_NAME_FA}، ماموریت، ارزش‌ها و مسیر رشد پلتفرم خرید و فروش لوازم آفرود.`,
  path: '/about-us',
  keywords: ['درباره جیپو', 'پلتفرم آفرود', 'بازار لوازم آفرود'],
});

export default function AboutUsPage() {
  return (
    <>
      <JsonLd data={buildAboutPageJsonLd()} />
      <div className="container space-y-6">
        <div className="rounded-xl border bg-card p-6">
          <h1 className="text-2xl font-bold">درباره ما</h1>
          <p className="text-muted-foreground mt-2 text-sm leading-7">
            {SITE_NAME_FA} یک بازار تخصصی برای تجهیزات آفرود است که با الهام از الگوی پلتفرم‌های آگهی
            محلی، روی سادگی ثبت آگهی، ارتباط مستقیم و تجربه امن معامله تمرکز دارد.
          </p>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          {ABOUT_US_BLOCKS.map((block: SiteContentBlock) => (
            <article key={block.title} className="rounded-xl border bg-card p-5">
              <h2 className="text-lg font-semibold">{block.title}</h2>
              <p className="text-muted-foreground mt-2 text-sm leading-7">{block.description}</p>
            </article>
          ))}
        </section>
        <div className="w-full center">
          <SiteLogo size="lg" imageClassName="w-full h-120 lg:min-w-md" />
        </div>
      </div>
    </>
  );
}
