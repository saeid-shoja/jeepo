import Image from 'next/image';
import { cn } from '@/lib/utils';

type BlogCoverImageProps = {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
  sizes?: string;
};

function isLocalImage(src: string): boolean {
  const trimmed = src.trim();
  return trimmed.startsWith('/') && !trimmed.startsWith('//');
}

/** Blog cover: only same-origin paths use next/image; external URLs use native img. */
export function BlogCoverImage({
  src,
  alt,
  priority = false,
  className,
  sizes = '(max-width: 1280px) 100vw, 1280px',
}: BlogCoverImageProps) {
  if (!isLocalImage(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src.trim()}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className={cn('absolute inset-0 size-full object-cover', className)}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      className={cn('object-cover', className)}
      sizes={sizes}
    />
  );
}
