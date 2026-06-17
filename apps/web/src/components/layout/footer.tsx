import { SITE_EMAIL, SITE_NAME_FA } from '@offroad/shared';
import { Mail, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';
import { SiteLogo } from '@/components/layout/site-logo';
import { Separator } from '@/components/ui/separator';

const shopLinks = [
  { href: '/', label: 'صفحه اصلی' },
  { href: '/products?advertiserType=SHOP', label: 'فروشگاه' },
  { href: '/products?advertiserType=AUCTION', label: 'مزایده‌ها' },
  { href: '/categories', label: 'دسته‌بندی‌ها' },
];

const accountLinks = [
  { href: '/products/new', label: 'ثبت آگهی' },
  { href: '/login', label: 'ورود' },
  { href: '/register', label: 'ثبت‌نام' },
  { href: '/dashboard', label: 'پنل کاربری' },
];

const infoLinks = [
  { href: '/about-us', label: 'درباره ما' },
  { href: '/roles', label: 'قوانین وب‌سایت و کسب‌وکار' },
  { href: '/faq', label: 'سوالات پرتکرار' },
];

/** Exact snippet from enamad.ir — must not be altered for verification. */
const ENAMAD_TRUST_SEAL_HTML =
  "<a referrerpolicy='origin' target='_blank' href='https://trustseal.enamad.ir/?id=745923&Code=UUqyBD9oyXBa0odv13CCIZrvb5uBn2Fq'><img referrerpolicy='origin' src='https://trustseal.enamad.ir/logo.aspx?id=745923&Code=UUqyBD9oyXBa0odv13CCIZrvb5uBn2Fq' alt='' style='cursor:pointer' code='UUqyBD9oyXBa0odv13CCIZrvb5uBn2Fq'></a>";

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.href + link.label}>
            <Link
              href={link.href}
              className="text-muted-foreground hover:text-primary text-sm transition-colors"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t bg-card mt-12">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4 sm:col-span-2 lg:col-span-1">
            <SiteLogo size="lg" />
            <p className="text-muted-foreground text-sm leading-relaxed">
              خرید و فروش لوازم آفرود، قطعات یدکی و تجهیزات آفرودی دست دوم و مزایده ای.
            </p>
            <div className="text-muted-foreground space-y-2 text-sm">
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" />
                09333092013
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" />
                {SITE_EMAIL}
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0" />
                تهران، ایران
              </p>
            </div>
          </div>

          <FooterColumn title="فروشگاه" links={shopLinks} />
          <FooterColumn title="حساب کاربری" links={accountLinks} />
          <div>
            <FooterColumn title="راهنما" links={infoLinks} />
            <div
              className="flex justify-center"
              // biome-ignore lint/security/noDangerouslySetInnerHtml: enamad.ir requires unmodified embed HTML
              dangerouslySetInnerHTML={{ __html: ENAMAD_TRUST_SEAL_HTML }}
            />
          </div>
        </div>
        <Separator className="my-8" />
        <div className="text-muted-foreground flex w-full flex-col items-center justify-between gap-2 text-center text-xs sm:flex-row sm:text-sm">
          <p>
            © {new Date().getFullYear()} {SITE_NAME_FA} — تمامی حقوق محفوظ است.
          </p>
          <p>طراحی شده برای علاقه‌مندان آفرود و آفرودی‌ها</p>
        </div>
      </div>
    </footer>
  );
}
