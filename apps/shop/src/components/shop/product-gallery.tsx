'use client';

import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ProductMedia } from '@/components/shop/product-media';
import { Button } from '@/components/ui/button';
import { isProductVideoUrl } from '@/lib/product-image';
import { cn } from '@/lib/utils';

type ProductGalleryProps = {
  images: string[];
  title: string;
  badge?: React.ReactNode;
  /** Change this when switching products so the gallery resets. */
  resetKey?: string;
};

export function ProductGallery({ images, title, badge, resetKey }: ProductGalleryProps) {
  const [index, setIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const count = images.length;
  const safeIndex = count > 0 ? Math.min(index, count - 1) : 0;
  const current = count > 0 ? images[safeIndex] : null;
  const canNavigate = count > 1;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setIndex(0);
    setLightboxOpen(false);
  }, [resetKey]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [lightboxOpen]);

  useEffect(() => {
    if (!lightboxOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setLightboxOpen(false);
        return;
      }
      if (!canNavigate) return;
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        setIndex((i) => (i - 1 + count) % count);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setIndex((i) => (i + 1) % count);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxOpen, canNavigate, count]);

  const goPrev = () => {
    if (!canNavigate) return;
    setIndex((i) => (i - 1 + count) % count);
  };

  const goNext = () => {
    if (!canNavigate) return;
    setIndex((i) => (i + 1) % count);
  };

  const renderNav = (size: 'sm' | 'lg') => {
    if (!canNavigate) return null;
    const btnClass =
      size === 'lg'
        ? 'size-11 rounded-full border-white/20 bg-black/55 text-white hover:bg-black/75 hover:text-white'
        : 'size-9 rounded-full border-white/30 bg-black/45 text-white shadow-md hover:bg-black/65 hover:text-white';

    return (
      <>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn('absolute top-1/2 start-2 z-20 -translate-y-1/2', btnClass)}
          onClick={goPrev}
          aria-label="رسانه قبلی"
        >
          <ArrowRight className={size === 'lg' ? 'size-5' : 'size-4'} />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn('absolute top-1/2 end-2 z-20 -translate-y-1/2', btnClass)}
          onClick={goNext}
          aria-label="رسانه بعدی"
        >
          <ArrowLeft className={size === 'lg' ? 'size-5' : 'size-4'} />
        </Button>
      </>
    );
  };

  const lightbox =
    lightboxOpen && current && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[9999] flex flex-col bg-black/95"
            role="dialog"
            aria-modal="true"
            aria-label="گالری تمام‌صفحه"
          >
            <div className="relative z-20 flex items-center justify-between gap-3 px-3 py-3 sm:px-4">
              <p className="text-sm text-white/80">
                {(safeIndex + 1).toLocaleString('fa-IR')} از {count.toLocaleString('fa-IR')}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-10 rounded-full text-white hover:bg-white/15 hover:text-white"
                onClick={() => setLightboxOpen(false)}
                aria-label="بستن"
              >
                <X className="size-5" />
              </Button>
            </div>

            <div className="relative z-10 min-h-0 flex-1">
              <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-8">
                <ProductMedia
                  key={`lightbox-${current}`}
                  src={current}
                  alt={title}
                  active
                  priority
                  deferUntilVisible={false}
                  className="relative h-full max-h-[90svh] w-full max-w-full sm:max-h-[min(85vh,900px)] sm:max-w-5xl"
                  mediaClassName="object-contain"
                  sizes="100vw"
                />
              </div>
              {renderNav('lg')}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="w-full max-w-full space-y-3">
      {/* Mobile: square capped by page width and 90% viewport height so large photos stay inside. */}
      <div className="relative mx-auto aspect-square w-full max-w-full overflow-hidden rounded-lg bg-muted max-md:w-[min(100%,90svh)] max-md:max-h-[90svh]">
        {current ? (
          <>
            <ProductMedia
              key={current}
              src={current}
              alt={title}
              active
              priority={safeIndex === 0}
              deferUntilVisible={false}
              className="absolute inset-0 size-full max-h-full max-w-full"
              mediaClassName="object-contain max-h-full max-w-full lg:object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <button
              type="button"
              className="absolute inset-0 z-10 cursor-zoom-in bg-transparent"
              onClick={() => setLightboxOpen(true)}
              aria-label="نمایش تمام‌صفحه"
            />
          </>
        ) : (
          <div className="text-muted-foreground flex size-full items-center justify-center">
            بدون تصویر
          </div>
        )}

        {badge ? (
          <div className="pointer-events-none absolute top-2 right-2 z-30 flex flex-col gap-1">
            {badge}
          </div>
        ) : null}

        {renderNav('sm')}

        {count > 0 ? (
          <div className="pointer-events-none absolute bottom-2 left-1/2 z-30 -translate-x-1/2 rounded-full bg-black/55 px-2.5 py-0.5 text-xs text-white">
            {(safeIndex + 1).toLocaleString('fa-IR')} / {count.toLocaleString('fa-IR')}
          </div>
        ) : null}
      </div>

      {count > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <Button
              key={`${i}-${img.slice(0, 40)}`}
              type="button"
              variant="ghost"
              onClick={() => setIndex(i)}
              className={cn(
                'relative h-16 w-16 shrink-0 overflow-hidden rounded-sm border-2 p-0',
                safeIndex === i ? 'border-primary' : 'border-transparent',
              )}
              aria-label={`رسانه ${(i + 1).toLocaleString('fa-IR')}`}
              aria-current={safeIndex === i ? 'true' : undefined}
            >
              <ProductMedia
                src={img}
                alt=""
                active={false}
                priority={false}
                deferUntilVisible
                className="absolute inset-0"
                mediaClassName="object-cover"
                sizes="64px"
              />
              {isProductVideoUrl(img) ? (
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25 text-[10px] font-medium text-white">
                  ویدیو
                </span>
              ) : null}
            </Button>
          ))}
        </div>
      ) : null}

      {lightbox}
    </div>
  );
}
