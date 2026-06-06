'use client';

import { Eye, EyeOff } from 'lucide-react';
import * as React from 'react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const PasswordInput = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, ...props }, ref) => {
    const [show, setShow] = React.useState(false);

    return (
      <div className="relative">
        <Input
          ref={ref}
          type={show ? 'text' : 'password'}
          className={cn('pe-10', className)}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={show ? 'مخفی کردن رمز عبور' : 'نمایش رمز عبور'}
          onClick={() => setShow((visible) => !visible)}
          className="text-muted-foreground hover:text-foreground absolute inset-y-0 end-2 flex items-center justify-center rounded-sm p-1"
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    );
  },
);
PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };
