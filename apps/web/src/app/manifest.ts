import { SITE_DESCRIPTION, SITE_NAME_FA } from '@offroad/shared';
import type { MetadataRoute } from 'next';
import { APPLE_TOUCH_ICON, FAVICON, SITE_LOGO } from '@/lib/seo';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME_FA,
    short_name: SITE_NAME_FA,
    description: SITE_DESCRIPTION,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#d62828',
    lang: 'fa',
    dir: 'rtl',
    icons: [
      { src: FAVICON, sizes: 'any', type: 'image/x-icon' },
      { src: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { src: APPLE_TOUCH_ICON, sizes: '180x180', type: 'image/png' },
      { src: SITE_LOGO, sizes: '1536x1024', type: 'image/png', purpose: 'any' },
    ],
  };
}
