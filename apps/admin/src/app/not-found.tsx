import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-bold">صفحه یافت نشد</h1>
      <p className="text-muted-foreground text-sm">مسیر درخواست‌شده وجود ندارد.</p>
      <Link href="/dashboard" className="text-primary text-sm hover:underline">
        بازگشت به داشبورد
      </Link>
    </div>
  );
}
