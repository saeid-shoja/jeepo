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
    title: `${SITE_NAME_FA} |  فروشگاه تخصصی لوازم آفرود و کمپی`,
    description:
      'خرید و فروش لوازم و تجهیزات آفرود با ضمانت اصالت کالا. وقتی جیپو هست دیگه تجهیزات ماشینت رو مفتی روی ماشین نمیدی',
    link: '/products',
    linkLabel: `فروشگاه ${SITE_NAME_FA}`,
  },
  {
    id: '2',
    imageUrl: '/images/hero/s2.webp',
    title: 'دسته بندی های مختلف تجهیزات آفرودی دست دوم',
    description:
      'لاستیک، لیفت کیت، تجهیزات بدنه و قطعات اورجینال  با قیمت های متنوع رو تو دسته بندی های مشخص پیدا کن',
    link: '/categories',
    linkLabel: 'دسته‌بندی‌ها',
  },
  {
    id: '3',
    imageUrl: '/images/hero/s3.webp',
    title: 'خرید آنلاین لوازم آفرودی',
    description:
      'جدیدترین محصولات فروشگاه جیپو را ببینید؛ قطعات و تجهیزات آفرودی با ارسال به سراسر ایران.',
    link: '/products',
    linkLabel: 'مشاهده محصولات',
  },
  /* مزایده — موقتاً غیرفعال
  {
    id: '4',
    imageUrl: '/images/hero/s4.webp',
    title: 'آگهی خودتو به صورت مزایده ثبت کن',
    description:
      'میتونی با برگزاری یک مزایده توی یک بازه مشخص به بالاترین قیمت محصول دست‌دوم خودتو بفروشی',
    link: '/auctions',
    linkLabel: 'مزایده ها',
  },
  */
  {
    id: '5',
    imageUrl: '/images/hero/s5.webp',
    title: 'خرید امن با تضمین جیپو',
    description:
      'محصولات دارای تضمین جیپو را با خیال راحت از طریق سایت بخرید؛ مبلغ تا تحویل نزد فروشگاه می‌ماند',
    link: '/products',
    linkLabel: 'مشاهده محصولات',
  },
];

export async function fetchSlides(): Promise<Slide[]> {
  // Static slides until a CMS /slides API is implemented on the backend.
  return MOCK_SLIDES;
}
