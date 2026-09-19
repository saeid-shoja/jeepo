'use client';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 py-12">
      <div className="max-w-lg rounded-2xl border border-red-200 bg-card p-8 text-center shadow-sm dark:border-red-950/60">
        <p className="text-sm font-medium text-red-600 dark:text-red-400">خطا</p>
        <h2 className="mt-3 text-2xl font-bold text-foreground">مشکلی در نمایش این صفحه پیش آمد</h2>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          لطفاً چند لحظه صبر کنید و دوباره امتحان کنید. اگر مشکل تکرار شد، می‌توانید به صفحه اصلی
          بازگردید.
        </p>

        {isDev && (
          <pre className="mt-4 overflow-auto rounded-lg bg-muted p-3 text-right text-xs text-red-600 dark:text-red-400">
            {error.message}
          </pre>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            تلاش مجدد
          </button>
          <a
            href="/"
            className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            بازگشت به خانه
          </a>
        </div>
      </div>
    </div>
  );
}
