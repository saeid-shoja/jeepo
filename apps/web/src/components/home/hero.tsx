'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import { fetchSlides, type Slide } from '@/lib/get-landing-slides';
import { cn } from '@/lib/utils';

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
        className="bg-muted flex h-[calc(100svh-3.5rem)] w-full items-center justify-center"
        aria-label="در حال بارگذاری ..."
      >
        <div className="border-primary size-10 animate-spin rounded-full border-4 border-t-transparent" />
      </section>
    );
  }

  if (slides.length === 0) return null;

  return (
    <section className="relative w-full my-5" aria-label="main slider">
      <Carousel
        setApi={setApi}
        opts={{ loop: true }}
        className="h-[calc(60svh-3.5rem)] w-full"
      >
        <CarouselContent className="ms-0 h-full">
          {slides.map((slide) => (
            <CarouselItem key={slide.id} className="ps-0">
              <div className="relative h-[calc(60svh-3.5rem)] w-full overflow-hidden">
                <Image
                  src={slide.imageUrl}
                  alt={slide.title}
                  fill
                  priority={slide.id === slides[0]?.id}
                  className="object-cover"
                  sizes="100vw"
                />
                <div className="from-background/95 via-background/40 absolute inset-0 bg-linear-to-t to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-end p-6 pb-16 md:p-12 md:pb-20">
                  <div className="mx-auto w-full max-w-7xl">
                    <h1 className="text-foreground max-w-2xl text-3xl font-bold md:text-5xl">
                      {slide.title}
                    </h1>
                    {slide.description && (
                      <p className="text-muted-foreground mt-4 max-w-xl text-lg md:text-xl">
                        {slide.description}
                      </p>
                    )}
                    {slide.link && (
                      <div className="mt-6">
                        <Button asChild size="lg">
                          <Link href={slide.link}>
                            {slide.linkLabel ?? 'مشاهده بیشتر'}
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {slides.length > 1 && (
          <>
            <CarouselPrevious className="border-background/80 bg-background/80 text-foreground hover:bg-background" />
            <CarouselNext className="border-background/80 bg-background/80 text-foreground hover:bg-background" />
            <div className="absolute bottom-6 inset-s-1/2 z-10 flex -translate-x-1/2 gap-2">
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  aria-label={`رفتن به اسلاید ${index + 1}`}
                  onClick={() => api?.scrollTo(index)}
                  className={cn(
                    'size-2.5 rounded-full transition-all',
                    current === index
                      ? 'bg-primary w-8'
                      : 'bg-foreground/40 hover:bg-foreground/70',
                  )}
                />
              ))}
            </div>
          </>
        )}
      </Carousel>
    </section>
  );
}
