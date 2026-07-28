'use client';

import { useEffect, useRef, useState } from 'react';
import { ProductImage } from '@/components/shop/product-image';
import { isProductVideoUrl } from '@/lib/product-image';
import { cn } from '@/lib/utils';

type ProductMediaProps = {
  src?: string | null;
  alt: string;
  /** Autoplay when this slide is the active one (videos). */
  active?: boolean;
  priority?: boolean;
  /**
   * Defer media until after idle + near viewport.
   * Default: true unless `priority` is set.
   */
  deferUntilVisible?: boolean;
  className?: string;
  /** Applied to img/video. Default: contain on mobile, cover on lg+. */
  mediaClassName?: string;
  sizes?: string;
};

function scheduleWhenIdle(cb: () => void): () => void {
  if (typeof window === 'undefined') {
    cb();
    return () => {};
  }
  const w = window as Window & {
    requestIdleCallback?: (fn: () => void, opts?: { timeout: number }) => number;
    cancelIdleCallback?: (id: number) => void;
  };
  if (typeof w.requestIdleCallback === 'function') {
    const id = w.requestIdleCallback(cb, { timeout: 1000 });
    return () => w.cancelIdleCallback?.(id);
  }
  const id = window.setTimeout(cb, 120);
  return () => window.clearTimeout(id);
}

export function ProductMedia({
  src,
  alt,
  active = true,
  priority = false,
  deferUntilVisible = !priority,
  className,
  mediaClassName,
  sizes,
}: ProductMediaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isVideo = Boolean(src && isProductVideoUrl(src));
  const fitClass = mediaClassName ?? 'object-contain lg:object-cover';
  const [visible, setVisible] = useState(!deferUntilVisible);

  useEffect(() => {
    if (!isVideo || !deferUntilVisible || visible) return;
    const el = containerRef.current;
    if (!el) return;

    let cancelled = false;
    let observer: IntersectionObserver | null = null;

    const startObserving = () => {
      if (cancelled) return;
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            setVisible(true);
            observer?.disconnect();
          }
        },
        { rootMargin: '200px 0px', threshold: 0.01 },
      );
      observer.observe(el);
    };

    const cancelIdle = scheduleWhenIdle(startObserving);
    return () => {
      cancelled = true;
      cancelIdle();
      observer?.disconnect();
    };
  }, [deferUntilVisible, isVideo, visible]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !isVideo || !visible) return;
    if (active) {
      el.currentTime = 0;
      void el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [active, isVideo, visible]);

  if (isVideo && src) {
    return (
      <div ref={containerRef} className={cn('relative overflow-hidden bg-muted', className)}>
        {!visible && <div className="absolute inset-0 animate-pulse bg-muted" aria-hidden />}
        {visible ? (
          <video
            ref={videoRef}
            key={src}
            src={src}
            className={cn('absolute inset-0 h-full w-full', fitClass)}
            muted
            loop
            playsInline
            autoPlay={active}
            preload={active ? 'auto' : 'metadata'}
            aria-label={alt}
          />
        ) : null}
      </div>
    );
  }

  return (
    <ProductImage
      src={src}
      alt={alt}
      priority={priority}
      deferUntilVisible={deferUntilVisible}
      className={className}
      imageClassName={fitClass}
      sizes={sizes}
    />
  );
}
