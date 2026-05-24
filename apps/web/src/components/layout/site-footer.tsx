import Link from 'next/link';
import { ShoppingBag, Phone, Mail, MapPin } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const shopLinks = [
  { href: '/', label: 'صفحه اصلی' },
  { href: '/products?type=SHOP', label: 'فروشگاه' },
  { href: '/products?type=CLIENT', label: 'بازارچه آگهی‌ها' },
  { href: '/categories', label: 'دسته‌بندی‌ها' },
];

const accountLinks = [
  { href: '/products/new', label: 'ثبت آگهی' },
  { href: '/login', label: 'ورود' },
  { href: '/register', label: 'ثبت‌نام' },
  { href: '/dashboard', label: 'پنل کاربری' },
];

const infoLinks = [
  { href: '/products', label: 'جستجوی محصول' },
  { href: '/categories', label: 'برندها و دسته‌ها' },
  { href: '#', label: 'قوانین و مقررات' },
  { href: '#', label: 'تماس با ما' },
];

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
            <Link href="/" className="text-primary flex items-center gap-2 text-lg font-bold">
              <ShoppingBag className="h-5 w-5" />
              آفرود شاپ
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              خرید و فروش لوازم آفرود، قطعات یدکی و تجهیزات آفرودی با تضمین کیفیت.
            </p>
            <div className="text-muted-foreground space-y-2 text-sm">
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" />
                ۰۲۱-۱۲۳۴۵۶۷۸
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" />
                info@offroadshop.ir
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0" />
                تهران، ایران
              </p>
            </div>
          </div>

          <FooterColumn title="فروشگاه" links={shopLinks} />
          <FooterColumn title="حساب کاربری" links={accountLinks} />
          <FooterColumn title="راهنما" links={infoLinks} />
        </div>

        <Separator className="my-8" />

        <div className="text-muted-foreground flex flex-col items-center justify-between gap-2 text-center text-xs sm:flex-row sm:text-sm">
          <p>© {new Date().getFullYear()} آفرود شاپ — تمامی حقوق محفوظ است.</p>
          <p>طراحی شده برای علاقه‌مندان آفرود و آفرودی‌ها</p>
        </div>
      </div>
    </footer>
  );
}
