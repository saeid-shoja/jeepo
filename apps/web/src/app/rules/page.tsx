import { SITE_NAME_FA, WEBSITE_BUSINESS_RULES } from '@offroad/shared';
import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'قوانین وب‌سایت و کسب‌وکار',
  description: `آشنایی با قوانین انتشار آگهی، معامله و چارچوب کسب‌وکار در ${SITE_NAME_FA}.`,
  path: '/roles',
  keywords: ['قوانین جیپو', 'قوانین ثبت آگهی', 'معامله امن'],
});

export default function RolesPage() {
  return (
    <div className="container space-y-6">
      <div className="rounded-xl border bg-card p-6">
        <h1 className="text-2xl font-bold">قوانین وب‌سایت و کسب‌وکار</h1>
        <p className="text-muted-foreground mt-2 text-sm leading-7">
          این موارد چارچوب استفاده از {SITE_NAME_FA} را مشخص می‌کند تا معاملات شفاف‌تر، امن‌تر و
          قابل‌اعتمادتر انجام شوند.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {WEBSITE_BUSINESS_RULES.map((rule) => (
          <article key={rule.title} className="rounded-xl border bg-card p-5">
            <h2 className="text-lg font-semibold">{rule.title}</h2>
            <ul className="mt-3 list-disc space-y-2 pr-5 text-sm leading-7">
              {rule.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </div>
  );
}
