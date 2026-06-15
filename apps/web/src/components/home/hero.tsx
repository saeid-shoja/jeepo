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
import { fetchSlides, type Slide } from '@/lib/get-landing-slides';
import { cn } from '@/lib/utils';

const MOBILE_HERO_HEIGHT = 'h-[min(55svh,calc(100svh-8rem))] min-h-[16rem]';

const DESKTOP_HERO_HEIGHT = 'lg:h-[min(38svh,calc(50svh-4rem))] lg:min-h-[13rem]';

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
    <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2 sm:bottom-6 lg:bottom-3">
      {slides.map((slide, index) => (
        <button
          key={slide.id}
          type="button"
          aria-label={`رفتن به اسلاید ${index + 1}`}
          aria-current={current === index ? 'true' : undefined}
          onClick={() => onSelect(index)}
          className={cn(
            'h-2 rounded-full transition-all',
            current === index
              ? 'bg-primary w-6 lg:bg-primary'
              : 'bg-foreground/40 hover:bg-foreground/70 w-2 lg:bg-foreground/30',
          )}
        />
      ))}
    </div>
  );
}

/** Mobile — full-bleed image with overlay text (original style). */
function MobileHeroSlide({ slide, priority }: { slide: Slide; priority?: boolean }) {
  return (
    <div className={cn('relative w-full overflow-hidden lg:hidden', MOBILE_HERO_HEIGHT)}>
      <Image
        src={slide.imageUrl}
        alt={slide.title}
        fill
        priority={priority}
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-linear-to-t from-black/65 via-black/10 to-transparent" />
      <div className="absolute inset-0 flex flex-col justify-end p-4 pb-14 sm:p-6 sm:pb-16">
        <div className="mx-auto w-full max-w-7xl">
          <h1 className="max-w-2xl text-xl font-bold text-white sm:text-2xl">{slide.title}</h1>
          {slide.description && (
            <p className="text-card mt-3 max-w-xl text-sm sm:mt-4 sm:text-base">
              {slide.description}
            </p>
          )}
          {slide.link && (
            <div className="mt-4 sm:mt-6">
              <Button asChild size="lg" className="w-full max-w-xs rounded-md sm:w-auto">
                <Link href={slide.link}>{slide.linkLabel ?? 'مشاهده بیشتر'}</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Desktop — one card; edge images fade to transparent toward the center. */
function DesktopHeroSlide({ slide, priority }: { slide: Slide; priority?: boolean }) {
  return (
    <div className="hidden w-full py-4 lg:block">
      <div
        className={cn(
          'bg-card relative mx-auto flex w-full items-center overflow-hidden border shadow-md',
          DESKTOP_HERO_HEIGHT,
        )}
      >
        {/* RTL: first in DOM = visual right */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-[42%]">
          <Image
            src={slide.imageUrl}
            alt=""
            fill
            priority={priority}
            className="object-cover mask-[linear-gradient(to_left,black_25%,transparent_93%)] [-webkit-mask-image:linear-gradient(to_left,black_25%,transparent_92%)]"
            sizes="50vw"
            aria-hidden
          />
        </div>

        <div className="pointer-events-none absolute inset-y-0 left-0 w-[42%]">
          <Image
            src={slide.imageUrl}
            alt=""
            fill
            className="object-cover mask-[linear-gradient(to_right,black_25%,transparent_93%)] [-webkit-mask-image:linear-gradient(to_right,black_25%,transparent_92%)]"
            sizes="50vw"
            aria-hidden
          />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-xl flex-col items-center justify-center gap-3 px-6 py-8 text-center">
          <h2 className="text-xl font-bold leading-snug md:text-2xl lg:text-3xl">{slide.title}</h2>
          {slide.description && (
            <p className="text-muted-foreground line-clamp-4 text-sm leading-relaxed md:text-base">
              {slide.description}
            </p>
          )}
          {slide.link && (
            <Button asChild size="lg" className="mt-1">
              <Link href={slide.link}>{slide.linkLabel ?? 'مشاهده بیشتر'}</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function HeroSlider() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    fetchSlides()
      .then(setSlides)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());

    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on('select', onSelect);

    return () => {
      api.off('select', onSelect);
    };
  }, [api]);

  useEffect(() => {
    if (!api || slides.length <= 1) return;

    const timer = setInterval(() => {
      if (api.canScrollNext()) {
        api.scrollNext();
      } else {
        api.scrollTo(0);
      }
    }, 6000);

    return () => clearInterval(timer);
  }, [api, slides.length]);

  if (loading) {
    return (
      <section
        className={cn(
          'bg-muted flex w-full items-center justify-center',
          MOBILE_HERO_HEIGHT,
          DESKTOP_HERO_HEIGHT,
        )}
        aria-label="در حال بارگذاری ..."
      >
        <div className="border-primary size-10 animate-spin rounded-full border-4 border-t-transparent" />
      </section>
    );
  }

  if (slides.length === 0) return null;

  return (
    <section className="relative w-full overflow-hidden lg:bg-muted/30" aria-label="main slider">
      <Carousel
        setApi={setApi}
        opts={{ loop: true }}
        className={cn('w-full', MOBILE_HERO_HEIGHT, 'lg:h-auto', DESKTOP_HERO_HEIGHT)}
      >
        <CarouselContent className="ms-0 h-full lg:h-auto">
          {slides.map((slide, index) => (
            <CarouselItem key={slide.id} className="ps-0">
              <MobileHeroSlide slide={slide} priority={index === 0} />
              <DesktopHeroSlide slide={slide} priority={index === 0} />
            </CarouselItem>
          ))}
        </CarouselContent>

        {slides.length > 1 && (
          <>
            <CarouselPrevious className="border-background/80 bg-background/80 text-foreground hover:bg-background top-1/2 hidden lg:inline-flex" />
            <CarouselNext className="border-background/80 bg-background/80 text-foreground hover:bg-background top-1/2 hidden lg:inline-flex" />
            <SlideDots slides={slides} current={current} onSelect={(i) => api?.scrollTo(i)} />
          </>
        )}
      </Carousel>
    </section>
  );
}
