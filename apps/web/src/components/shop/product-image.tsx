'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

const FALLBACK = '/images/product/no-photo.webp';

type ProductImageProps = {
  src?: string | null;
  alt: string;
  /** Load immediately (hero / LCP only). Prefer false for listing & product media. */
  priority?: boolean;
  /**
   * Defer media until after the page is idle and the element is near the viewport.
   * Default: true unless `priority` is set.
   */
  deferUntilVisible?: boolean;
  className?: string;
  imageClassName?: string;
  sizes?: string;
  fill?: boolean;
  width?: number;
  height?: number;
};

function isInlineDataUrl(src: string) {
  return src.startsWith('data:') || src.startsWith('blob:');
}

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

export function ProductImage({
  src,
  alt,
  priority = false,
  deferUntilVisible = !priority,
  className,
  imageClassName,
  sizes = '(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw',
  fill = true,
  width,
  height,
}: ProductImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(!deferUntilVisible);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!deferUntilVisible || visible) return;
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

    // Let text/layout paint first, then attach observer.
    const cancelIdle = scheduleWhenIdle(startObserving);

    return () => {
      cancelled = true;
      cancelIdle();
      observer?.disconnect();
    };
  }, [deferUntilVisible, visible]);

  const resolved = !src || failed ? FALLBACK : src;
  const unoptimized = isInlineDataUrl(resolved);

  return (
    <div ref={containerRef} className={cn('relative overflow-hidden bg-muted', className)}>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-muted" aria-hidden />}
      {visible ? (
        <Image
          src={resolved}
          alt={alt}
          fill={fill}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          sizes={fill ? sizes : undefined}
          priority={priority}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          unoptimized={unoptimized}
          onLoad={() => setLoaded(true)}
          onError={() => {
            setFailed(true);
            setLoaded(true);
          }}
          className={cn(
            'transition-opacity duration-300',
            !imageClassName?.includes('object-') && 'object-cover',
            loaded ? 'opacity-100' : 'opacity-0',
            imageClassName,
          )}
        />
      ) : null}
    </div>
  );
}
