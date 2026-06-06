'use client';

import { Eye, EyeOff } from 'lucide-react';
import * as React from 'react';

type PasswordInputProps = React.ComponentProps<'input'>;

export function PasswordInput({ className = '', ...props }: PasswordInputProps) {
  const [show, setShow] = React.useState(false);

  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        className={`w-full rounded-sm border px-3 py-2 pe-10 outline-none focus:border-primary ${className}`.trim()}
        {...props}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label={show ? 'مخفی کردن رمز عبور' : 'نمایش رمز عبور'}
        onClick={() => setShow((visible) => !visible)}
        className="absolute inset-y-0 end-2 flex items-center justify-center rounded-sm p-1 text-gray-500 hover:text-gray-800"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}
