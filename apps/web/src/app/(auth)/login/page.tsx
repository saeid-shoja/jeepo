import { Suspense } from 'react';
import { LoginForm } from './login-form';

export default function LoginPage() {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-8 sm:py-16">
      <Suspense
        fallback={<div className="py-16 text-center text-muted-foreground">در حال بارگذاری...</div>}
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
