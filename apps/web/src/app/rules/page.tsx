import {
  GUARANTEE_SERVICE_DESCRIPTION,
  GUARANTEE_SERVICE_INTRO,
  GUARANTEE_SERVICE_RULES,
  GUARANTEE_SERVICE_TITLE,
  SITE_NAME_FA,
  WEBSITE_BUSINESS_RULES,
  WEBSITE_RULES_INTRO,
} from '@offroad/shared';
import { ScrollText } from 'lucide-react';
import type { Metadata } from 'next';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'قوانین و مقررات',
  description: `قوانین و مقررات ${SITE_NAME_FA}؛ شرایط ثبت آگهی، رفتار کاربران، انجام معامله، پرداخت امن و حدود مسئولیت پلتفرم.`,
  path: '/rules',
  keywords: ['قوانین جیپو', 'قوانین ثبت آگهی', 'معامله امن', 'پرداخت امن', 'ضمانت جیپو'],
});

interface RuleClause {
  title?: string;
  items: string[];
  notes?: string[];
}

interface RuleSection {
  title: string;
  clauses?: RuleClause[];
}

interface RuleIntro {
  title: string;
  items: string[];
}

/* ───────────── ابزارهای کمکی ───────────── */

const faNumber = (n: number) => n.toLocaleString('fa-IR');

/** «تبصره ۱: متن…» → برچسب پررنگ + متن */
function splitNote(note: string) {
  const index = note.indexOf(':');
  if (index === -1) return { label: null, text: note };
  return { label: note.slice(0, index + 1), text: note.slice(index + 1).trim() };
}

const itemClassName = 'bg-card rounded-xl border px-5 shadow-xs last:border-b';
const triggerClassName =
  'items-center gap-3 py-5 text-base font-semibold text-start hover:no-underline';
const badgeClassName =
  'bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold';

/* ───────────── آکاردئون قوانین (قابل‌استفاده برای هر مجموعه قوانین) ───────────── */

function RulesAccordion({
  idPrefix,
  intro,
  rules,
}: {
  idPrefix: string;
  intro: RuleIntro;
  rules: RuleSection[];
}) {
  return (
    <Accordion type="multiple" defaultValue={[`${idPrefix}-intro`]} className="space-y-3">
      {/* مقدمه */}
      <AccordionItem value={`${idPrefix}-intro`} className={itemClassName}>
        <AccordionTrigger className={triggerClassName}>
          <span className="flex items-center gap-3">
            <span className={badgeClassName}>
              <ScrollText className="size-4" aria-hidden />
            </span>
            {intro.title}
          </span>
        </AccordionTrigger>
        <AccordionContent className="pb-6">
          <div className="space-y-3 text-sm leading-8">
            {intro.items.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* بخش‌های اصلی */}
      {rules.map((rule, i) => (
        <AccordionItem key={rule.title} value={`${idPrefix}-${i + 1}`} className={itemClassName}>
          <AccordionTrigger className={triggerClassName}>
            <span className="flex items-center gap-3">
              <span className={badgeClassName}>{faNumber(i + 1)}</span>
              {rule.title}
            </span>
          </AccordionTrigger>

          <AccordionContent className="pb-6">
            <div className="divide-y">
              {rule.clauses?.map((clause, j) => (
                <section
                  key={clause.title ?? `clause-${j}`}
                  className="space-y-3 py-5 first:pt-0 last:pb-0"
                >
                  {clause.title && (
                    <h3 className="text-[15px] font-semibold">
                      <span dir="ltr" className="text-muted-foreground me-2 font-normal">
                        {faNumber(i + 1)}-{faNumber(j + 1)}
                      </span>
                      {clause.title}
                    </h3>
                  )}

                  <ul className="marker:text-primary/60 list-disc space-y-2 ps-5 text-sm leading-8">
                    {clause.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>

                  {clause.notes?.map((note) => {
                    const { label, text } = splitNote(note);
                    return (
                      <p
                        key={note}
                        className="bg-muted/60 border-primary/50 rounded-lg border-s-4 p-3 text-sm leading-8"
                      >
                        {label && <strong className="font-semibold">{label} </strong>}
                        {text}
                      </p>
                    );
                  })}
                </section>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

/* ───────────── صفحه ───────────── */

export default function RolesPage() {
  return (
    <div className="container max-w-4xl space-y-12">
      {/* قوانین و مقررات عمومی */}
      <section className="space-y-6">
        <div className="bg-card rounded-xl border p-6">
          <h1 className="text-2xl font-bold">قوانین و مقررات {SITE_NAME_FA}</h1>
          <p className="text-muted-foreground mt-2 text-sm leading-7">
            سامانه‌ی ثبت آگهی و خرید و فروش تجهیزات آفرود و کمپینگ. برای مشاهده‌ی جزئیات هر بخش، روی
            عنوان آن بزنید.
          </p>
        </div>

        <RulesAccordion
          idPrefix="general"
          intro={WEBSITE_RULES_INTRO}
          rules={WEBSITE_BUSINESS_RULES}
        />
      </section>

      {/* قوانین سرویس تضمین جیپو */}
      <section id="guarantee" className="scroll-mt-24 space-y-6">
        <div className="bg-card rounded-xl border p-6">
          <h2 className="text-2xl font-bold">{GUARANTEE_SERVICE_TITLE}</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-7">
            {GUARANTEE_SERVICE_DESCRIPTION}
          </p>
        </div>

        <RulesAccordion
          idPrefix="guarantee"
          intro={GUARANTEE_SERVICE_INTRO}
          rules={GUARANTEE_SERVICE_RULES}
        />
      </section>
    </div>
  );
}
