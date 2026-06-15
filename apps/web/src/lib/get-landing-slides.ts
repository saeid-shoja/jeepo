import { SITE_NAME_FA } from '@offroad/shared';

export type Slide = {
  id: string;
  imageUrl: string;
  title: string;
  description?: string;
  link?: string;
  linkLabel?: string;
};

// Mock data until backend /slides endpoint is ready
export const MOCK_SLIDES: Slide[] = [
  {
    id: '1',
    imageUrl: '/images/hero/s1.webp',
    title: `${SITE_NAME_FA} | فروشگاه تخصصی لوازم آفرود`,
    description: 'خرید و فروش لوازم و تجهیزات آفرود با ضمانت اصالت کالا',
    link: '/products',
    linkLabel: `فروشگاه ${SITE_NAME_FA}`,
  },
  {
    id: '2',
    imageUrl: '/images/hero/s2.jpg',
    title: 'دسته بندی های مختلف تجهیزات آفرودی دست دوم',
    description:
      'لاستیک، لیفت کیت، تجهیزات بدنه و قطعات اورجینال  با قیمت های متنوع رو تو دسته بندی های مشخص پیدا کن',
    link: '/categories',
    linkLabel: 'دسته‌بندی‌ها',
  },
  {
    id: '3',
    imageUrl: '/images/hero/s3.jpg',
    title: 'تجهیزات آفرودی دست دومت رو با ثبت آگهی بفروش',
    description: `در ${SITE_NAME_FA}، محصول دست‌دوم خود را بفروشید`,
    link: '/products/new',
    linkLabel: 'ثبت آگهی',
  },
  {
    id: '4',
    imageUrl: '/images/hero/s4.jpeg',
    title: 'آگهی خودتو به صورت مزایده ثبت کن',
    description:
      'میتونی با برگزاری یک مزایده توی یک بازه مشخص به بالاترین قیمت محصول دست‌دوم خودتو بفروشی',
    link: '/auctions',
    linkLabel: 'مزایده ها',
  },
  {
    id: '5',
    imageUrl: '/images/hero/s5.webp',
    title: 'تجهیزاتت رو با تضمین فروشگاه بفروش',
    description:
      'با فعال کردن حالت تضمین فروشگاه ما واسطه معامله شما و خریدار میشیم تا معامله با خیال راحت تر از راه دور انجام بشه',
    link: '/products/new',
    linkLabel: 'ثبت آگهی',
  },
];

export async function fetchSlides(): Promise<Slide[]> {
  // Static slides until a CMS /slides API is implemented on the backend.
  return MOCK_SLIDES;
}
