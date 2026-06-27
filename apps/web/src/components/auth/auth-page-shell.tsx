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
    <div className="relative h-dvh min-h-0 overflow-hidden">
      <Image
        key={slide.id}
        src={slide.imageUrl}
        alt={slide.title}
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 flex h-full min-h-0 flex-col items-right justify-center overflow-y-auto px-4 py-6 lg:pr-30">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
