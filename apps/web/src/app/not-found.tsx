import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container flex min-h-[50vh] flex-col items-center justify-center gap-4 py-16 text-center">
      <h1 className="text-2xl font-bold">صفحه پیدا نشد</h1>
      <p className="text-muted-foreground text-sm">این آدرس وجود ندارد یا جابه‌جا شده است.</p>
      <Link href="/" className="text-primary text-sm font-medium hover:underline">
        بازگشت به صفحه اصلی
      </Link>
    </div>
  );
}
