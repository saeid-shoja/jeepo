
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { MOCK_SLIDES, type Slide } from '@/lib/get-landing-slides';
import { cn } from '@/lib/utils';

const MOBILE_HERO_HEIGHT =
  'h-[min(55svh,calc(100svh-8rem))] min-h-[16rem]';

const DESKTOP_HERO_HEIGHT =
  'lg:h-[min(38svh,calc(50svh-4rem))] lg:min-h-[13rem]';

function SlideDots({
  slides,
  current,
  onSelect,
}: {
  slides: Slide[];
  current: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div
      className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2 sm:bottom-6 lg:bottom-3"
      aria-label="انتخاب اسلاید"
    >
      {slides.map((slide, index) => (
        <button
          key={slide.id}
          type="button"
          aria-label={`رفتن به اسلاید ${index + 1}`}
          aria-current={current === index ? 'true' : undefined}
          onClick={() => onSelect(index)}
          className={cn(
            'h-2 rounded-full transition-[width,background-color] duration-200',
            current === index
              ? 'w-6 bg-primary'
              : 'w-2 bg-white/60 hover:bg-white',
          )}
        />
      ))}
    </div>
  );
}

function HeroSlide({
  slide,
  index,
}: {
  slide: Slide;
  index: number;
}) {
  const imageOnRight = index % 2 === 0;

  return (
    <div
      className={cn(
        'relative isolate w-full overflow-hidden lg:mx-auto',
        MOBILE_HERO_HEIGHT,
        'lg:h-auto',
        DESKTOP_HERO_HEIGHT,
        'lg:border lg:bg-card lg:shadow-md',
      )}
    >
      {/* Main image */}
     <Image
  src={slide.imageUrl}
  alt={slide.title}
  fill
  priority={index === 0}
  sizes="(min-width: 1024px) 60vw, 100vw"
  className={cn(
    'object-cover',
    imageOnRight
      ? 'lg:right-auto! lg:!left-0! lg:w-[60%]!'
      : 'lg:right-auto! lg:right-0! lg:w-[60%]!',
  )}
/>

      {/* Mobile overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-1 bg-linear-to-t from-black/75 via-black/20 to-transparent lg:hidden"
      />

      {/* Desktop gradient mask: always faces the text */}
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-y-0 z-2 hidden w-[85%] lg:block',
          imageOnRight ? 'right-0' : 'left-0',
          imageOnRight
            ? 'mask-[linear-gradient(to_left,black_45%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_left,black_55%,transparent_100%)]'
            : 'mask-[linear-gradient(to_right,black_45%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_right,black_55%,transparent_100%)]',
          'bg-card',
        )}
      />

      {/* Content: above the image and gradient */}
      <div
        className={cn(
          'absolute inset-0 z-10 flex flex-col justify-end p-4 pb-14 sm:p-6 sm:pb-16',
          'lg:inset-y-0 lg:flex lg:w-full lg:justify-center lg:p-8'
        )}
      >
        <div className={cn("w-full lg:w-1/2 lg:absolute"
          ,
          imageOnRight
            ? 'lg:right-0 lg:items-center lg:text-center'
            : 'lg:left-0 lg:items-center lg:text-center',
        )}>
          <h2 className="text-xl font-bold leading-snug text-white sm:text-2xl lg:text-foreground lg:text-3xl">
            {slide.title}
          </h2>

          {slide.description && (
            <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-white sm:text-base lg:text-muted-foreground">
              {slide.description}
            </p>
          )}

          {slide.link && (
            <div className="mt-4 sm:mt-6">
              <Button
                asChild
                size="lg"
                className="w-full max-w-xs rounded-md sm:w-auto"
              >
                <Link href={slide.link}>
                  {slide.linkLabel ?? 'مشاهده بیشتر'}
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function HeroSlider() {
  // Render available slides immediately; do not block the hero on a spinner.
  const slides = MOCK_SLIDES;

  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;

    const updateCurrent = () => {
      setCurrent(api.selectedScrollSnap());
    };

    updateCurrent();
    api.on('select', updateCurrent);

    return () => {
      api.off('select', updateCurrent);
    };
  }, [api]);

  useEffect(() => {
    if (!api || slides.length <= 1) return;

    const intervalId = window.setInterval(() => {
      // Do not animate a carousel in a hidden browser tab.
      if (document.visibilityState !== 'visible') return;

      api.scrollNext();
    }, 6000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [api, slides.length]);

  if (slides.length === 0) return null;

  return (
    <section
      className="relative w-full overflow-hidden lg:bg-muted/30"
      aria-label="اسلایدهای اصلی جیپو"
    >
      <Carousel
        setApi={setApi}
        opts={{
          loop: true,
          align: 'start',
          duration: 25,
        }}
        className={cn(
          'w-full',
          MOBILE_HERO_HEIGHT,
          'lg:h-auto',
          DESKTOP_HERO_HEIGHT,
        )}
      >
        <CarouselContent className="ms-0 h-full lg:h-auto">
          {slides.map((slide, index) => (
            <CarouselItem
              key={slide.id}
              className="h-full min-w-0 ps-0 lg:h-auto"
            >
              <HeroSlide slide={slide} index={index} />
            </CarouselItem>
          ))}
        </CarouselContent>

        {slides.length > 1 && (
          <>
            <CarouselPrevious className="top-1/2 z-20 hidden border-background/80 bg-background/80 text-foreground hover:bg-background lg:inline-flex" />

            <CarouselNext className="top-1/2 z-20 hidden border-background/80 bg-background/80 text-foreground hover:bg-background lg:inline-flex" />

            <SlideDots
              slides={slides}
              current={current}
              onSelect={(index) => api?.scrollTo(index)}
            />
          </>
        )}
      </Carousel>
    </section>
  );
}
