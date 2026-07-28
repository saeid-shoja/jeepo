'use client';

import { ArrowUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ScrollToTopButtonProps = {
  /** Show when viewport is within this many px of the document bottom. */
  bottomOffset?: number;
  className?: string;
};

export function ScrollToTopButton({ bottomOffset = 520, className }: ScrollToTopButtonProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = () => {
      const viewBottom = window.scrollY + window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      setVisible(viewBottom >= docHeight - bottomOffset);
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [bottomOffset]);

  if (!visible) return null;

  return (
    <Button
      type="button"
      size="icon"
      className={cn(
        'fixed bottom-6 start-4 z-40 size-11 rounded-full shadow-lg sm:start-6',
        className,
      )}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="بازگشت به بالا"
    >
      <ArrowUp className="size-5" />
    </Button>
  );
}
