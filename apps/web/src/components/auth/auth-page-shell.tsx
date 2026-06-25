'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { SiteLogo } from '@/components/layout/site-logo';
import { MOCK_SLIDES, type Slide } from '@/lib/get-landing-slides';

function pickRandomSlide(): Slide {
  return MOCK_SLIDES[Math.floor(Math.random() * MOCK_SLIDES.length)] ?? MOCK_SLIDES[0];
}

export function AuthPageShell({ children }: { children: React.ReactNode }) {
  const [slide, setSlide] = useState<Slide>(MOCK_SLIDES[1]);

  useEffect(() => {
    setSlide(pickRandomSlide());
  }, []);

  return (
    <div className="flex h-dvh min-h-0 flex-col lg:flex-row">
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-4 py-4 sm:py-6">
        <div className="my-auto flex w-full max-w-md flex-col items-center">
          <SiteLogo href="/" className="mb-4 w-20 shrink-0 lg:mb-5" />
          <div className="w-full">{children}</div>
        </div>
      </div>

      <div className="relative hidden min-h-0 lg:block lg:h-dvh lg:w-1/2 lg:shrink-0">
        <Image
          key={slide.id}
          src={slide.imageUrl}
          alt={slide.title}
          fill
          priority
          className="object-cover"
          sizes="50vw"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/50 via-black/10 to-transparent" />
      </div>
    </div>
  );
}
