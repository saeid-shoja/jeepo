import { SITE_NAME_FA } from '@offroad/shared';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export const SITE_LOGO_SRC = '/logo.png';

const sizeClasses = {
  xs: 'h-9 w-auto',
  sm: 'h-10 w-auto',
  md: 'h-12 w-auto',
  lg: 'h-16 w-auto',
} as const;

type SiteLogoProps = {
  className?: string;
  imageClassName?: string;
  showName?: boolean;
  nameClassName?: string;
  href?: string;
  priority?: boolean;
  size?: keyof typeof sizeClasses;
};

export function SiteLogo({
  className,
  imageClassName,
  showName = false,
  nameClassName,
  href = '/',
  priority = false,
  size = 'md',
}: SiteLogoProps) {
  const content = (
    <>
      <Image
        src={SITE_LOGO_SRC}
        alt={`${SITE_NAME_FA} — لوگو`}
        width={1260}
        height={948}
        priority={priority}
        className={cn('object-contain', sizeClasses[size], imageClassName)}
      />
      {showName && (
        <span className={cn('text-primary font-bold', nameClassName)}>{SITE_NAME_FA}</span>
      )}
    </>
  );

  const rootClassName = cn('inline-flex shrink-0 items-center gap-2', className);

  if (href) {
    return (
      <Link href={href} className={rootClassName} aria-label={`${SITE_NAME_FA} — صفحه اصلی`}>
        {content}
      </Link>
    );
  }

  return <div className={rootClassName}>{content}</div>;
}
