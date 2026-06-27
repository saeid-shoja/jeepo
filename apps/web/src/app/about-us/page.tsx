import {
  ABOUT_US_BLOCKS,
  ABOUT_US_FEATURES,
  ABOUT_US_INTRO,
  SITE_EMAIL,
  SITE_NAME_FA,
  SITE_TELEGRAM_HANDLE,
  SITE_TELEGRAM_SUPPORT,
  SITE_TELEGRAM_URL,
  type SiteContentBlock,
} from '@offroad/shared';
import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteLogo } from '@/components/layout/site-logo';
import { JsonLd } from '@/components/seo/json-ld';
import { buildAboutPageJsonLd, buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'درباره ما',
  description: `آشنایی با ${SITE_NAME_FA}، بازار تخصصی خرید و فروش لوازم آفرود، مزایده، تضمین فروشگاه و ثبت آگهی.`,
  path: '/about-us',
  keywords: ['درباره جیپو', 'پلتفرم آفرود', 'بازار لوازم آفرود', 'فروش لوازم دست دوم آفرود'],
});

export default function AboutUsPage() {
  return (
    <>
      <JsonLd data={buildAboutPageJsonLd()} />
      <div className="container space-y-8 pb-8">
        <div className="rounded-xl border bg-card p-6 md:p-8">
          <h1 className="text-2xl font-bold md:text-3xl">درباره {SITE_NAME_FA}</h1>
          <p className="text-muted-foreground mt-4 text-sm leading-8 md:text-base">{ABOUT_US_INTRO}</p>
          <p className="text-muted-foreground mt-3 text-sm leading-8">
            وب‌سایت رسمی:{' '}
            <Link href="https://jeepo.ir" className="text-primary hover:underline" dir="ltr">
              jeepo.ir
            </Link>
          </p>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ABOUT_US_BLOCKS.map((block: SiteContentBlock) => (
            <article key={block.title} className="rounded-xl border bg-card p-5">
              <h2 className="text-lg font-semibold">{block.title}</h2>
              <p className="text-muted-foreground mt-2 text-sm leading-7">{block.description}</p>
            </article>
          ))}
        </section>

        <section className="rounded-xl border bg-card p-6 md:p-8">
          <h2 className="text-xl font-semibold">امکانات پلتفرم</h2>
          <ul className="text-muted-foreground mt-4 grid gap-2 text-sm leading-7 sm:grid-cols-2">
            {ABOUT_US_FEATURES.map((feature) => (
              <li key={feature} className="flex gap-2">
                <span className="text-primary shrink-0" aria-hidden>
                  •
                </span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border bg-card p-6 md:p-8">
          <h2 className="text-xl font-semibold">ارتباط با ما</h2>
          <div className="text-muted-foreground mt-4 space-y-2 text-sm leading-7">
            <p>
              ایمیل:{' '}
              <a href={`mailto:${SITE_EMAIL}`} className="text-primary hover:underline" dir="ltr">
                {SITE_EMAIL}
              </a>
            </p>
            <p>
              کانال تلگرام:{' '}
              <a
                href={SITE_TELEGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
                dir="ltr"
              >
                {SITE_TELEGRAM_HANDLE}
              </a>
            </p>
            <p>
              پشتیبانی تلگرام:{' '}
              <a
                href={`https://t.me/${SITE_TELEGRAM_SUPPORT.slice(1)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
                dir="ltr"
              >
                {SITE_TELEGRAM_SUPPORT}
              </a>
            </p>
            <p>مکان: تهران، ایران</p>
          </div>
        </section>

        <div className="flex w-full justify-center">
          <SiteLogo size="lg" imageClassName="h-120 w-full lg:min-w-md" />
        </div>
      </div>
    </>
  );
}
