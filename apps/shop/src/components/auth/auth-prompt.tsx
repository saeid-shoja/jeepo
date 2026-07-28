'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

type AuthPromptProps = {
  title: string;
  description?: string;
  nextPath: string;
};

export function AuthPrompt({ title, description, nextPath }: AuthPromptProps) {
  const next = encodeURIComponent(nextPath);
  const registerHref = `/register?next=${next}`;

  return (
    <div className="mx-auto max-w-md space-y-4 rounded-lg border border-dashed px-6 py-12 text-center">
      <h2 className="text-lg font-semibold">{title}</h2>
      {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
        <Button asChild>
          <Link href={`/login?next=${next}`}>ورود</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={registerHref}>ثبت‌نام</Link>
        </Button>
      </div>
      <p className="text-muted-foreground text-xs">حساب کاربری با سایت اصلی جیپو مشترک است.</p>
    </div>
  );
}
