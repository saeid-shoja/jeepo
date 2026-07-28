import { FAQ_ITEMS, SITE_NAME_FA } from '@offroad/shared';
import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/json-ld';
import { buildFaqJsonLd, buildMetadata } from '@/lib/seo';

/** سوالات مربوط به مزایده / تقویت — موقتاً مخفی */
const HIDDEN_FAQ_QUESTIONS = new Set(['منظور از برچسب تقویت شده چیست؟']);

const visibleFaqItems = FAQ_ITEMS.filter((item) => !HIDDEN_FAQ_QUESTIONS.has(item.question));

export const metadata: Metadata = buildMetadata({
  title: 'سوالات پرتکرار',
  description: `پاسخ به سوالات پرتکرار درباره ثبت آگهی، امنیت معامله و قوانین ${SITE_NAME_FA}.`,
  path: '/faq',
  keywords: ['سوالات پرتکرار', 'راهنمای جیپو', 'ثبت آگهی آفرود'],
});

export default function FaqPage() {
  return (
    <>
      <JsonLd data={buildFaqJsonLd()} />
      <div className="container space-y-6">
        <div className="rounded-xl border bg-card p-6">
          <h1 className="text-2xl font-bold">سوالات پرتکرار</h1>
          <p className="text-muted-foreground mt-2 text-sm leading-7">
            این بخش بر اساس سوالات رایج کاربران در پلتفرم‌های آگهی طراحی شده تا سریع‌تر به پاسخ برسید.
          </p>
        </div>

        <section className="space-y-4">
          {visibleFaqItems.map((item) => (
            <article key={item.question} className="rounded-xl border bg-card p-5">
              <h2 className="text-base font-semibold">{item.question}</h2>
              <p className="text-muted-foreground mt-2 text-sm leading-7">{item.answer}</p>
            </article>
          ))}
        </section>
      </div>
    </>
  );
}
