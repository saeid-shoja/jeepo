/** Seed templates only — runtime data lives in the database; admin edits are not overwritten on sync. */

export const MOTORCYCLE_ATV_NAME = 'چهارچرخ و موتورسیکلت';

export const MOTORCYCLE_ATV_SUBCATEGORIES = [
  { name: 'تریل و کراس و اندرو', slug: 'trail-cross-enduro', sortOrder: 1 },
  { name: 'چهارچرخ ها', slug: 'atvs', sortOrder: 2 },
  { name: 'ادونچر و سفری', slug: 'adventure-touring', sortOrder: 3 },
] as const;

export const MOTORCYCLE_ATV_SLUG = 'motorcycle-atv';
export const LIBRARY_PARTS_SLUG = 'parts';
export const LIBRARY_CAR_BRANDS_SLUG = 'car-brands';
export const LIBRARY_CAMPING_SLUG = 'camping';
export const LIBRARY_CAMPING_NAME = 'تورهای گردشگری آفرودی و لوازم کمپی';

export type DefaultLibraryKind = 'PART_TREE' | 'CAR_BRANDS';

export type DefaultLibrary = {
  slug: string;
  name: string;
  kind: DefaultLibraryKind;
  sortOrder: number;
};

export const DEFAULT_LIBRARIES: DefaultLibrary[] = [
  { slug: LIBRARY_PARTS_SLUG, name: 'قطعات و یدکی خودرو', kind: 'PART_TREE', sortOrder: 1 },
  {
    slug: MOTORCYCLE_ATV_SLUG,
    name: MOTORCYCLE_ATV_NAME,
    kind: 'PART_TREE',
    sortOrder: 2,
  },
  { slug: LIBRARY_CAR_BRANDS_SLUG, name: 'برند خودرو', kind: 'CAR_BRANDS', sortOrder: 3 },
  { slug: LIBRARY_CAMPING_SLUG, name: LIBRARY_CAMPING_NAME, kind: 'PART_TREE', sortOrder: 4 },
];

/** Top-level part groups (قطعات library). */
export const DEFAULT_PART_GROUPS = [
  { name: 'موتور و انتقال قدرت و دف', slug: 'engine-drivetrain', sortOrder: 1 },
  { name: 'شاسی و سیستم تعلیق و چرخ ها ', slug: 'chassis', sortOrder: 2 },
  { name: 'برق و روشنایی خودرو', slug: 'electrical', sortOrder: 3 },
  { name: 'ظاهر و تجهیزات بدنه و داخل خودرو', slug: 'gear-style', sortOrder: 4 },
  { name: 'سایر', slug: 'misc-group', sortOrder: 5 },
] as const;

/** Subcategories under part groups. */
export const DEFAULT_PART_CHILDREN = [
  { name: 'تعلیق و زیربندی', slug: 'suspension', parentSlug: 'chassis', sortOrder: 1 },
  { name: 'رینگ و لاستیک', slug: 'tires-rims', parentSlug: 'chassis', sortOrder: 2 },
  { name: 'سایر', slug: 'other-chassis', parentSlug: 'chassis', sortOrder: 3 },
  {
    name: 'پروژکتور و نور و لوازم برقی ',
    slug: 'lighting',
    parentSlug: 'electrical',
    sortOrder: 1,
  },
  {
    name: 'مانیتورها و سیستم پخش و دوربین های خودرو',
    slug: 'system-camera',
    parentSlug: 'electrical',
    sortOrder: 2,
  },
  { name: 'ردیاب و دزدگیر و مسیریاب', slug: 'navigation', parentSlug: 'electrical', sortOrder: 3 },
  { name: 'سایر', slug: 'other-electrical', parentSlug: 'electrical', sortOrder: 4 },
  { name: 'اکسسوری و تزئینات', slug: 'accessories', parentSlug: 'gear-style', sortOrder: 1 },
  { name: 'لوازم داخل خودرو', slug: 'inside', parentSlug: 'gear-style', sortOrder: 2 },
  { name: 'لوازم ریکاوری خودرو', slug: 'recovery', parentSlug: 'gear-style', sortOrder: 3 },
  {
    name: 'سایه بان و چادر سقفی و چادر خودرو',
    slug: 'car-tent',
    parentSlug: 'gear-style',
    sortOrder: 4,
  },
  {
    name: 'سپرها و یدککش و تجهیزات لگن بار',
    slug: 'spare-parts',
    parentSlug: 'gear-style',
    sortOrder: 5,
  },
  { name: 'سایر', slug: 'other-gear-style', parentSlug: 'gear-style', sortOrder: 6 },
] as const;

/** Top-level groups (تور و کمپی library). */
export const DEFAULT_CAMPING_GROUPS = [
  { name: 'تورهای آفرودی', slug: 'offroad-tours', sortOrder: 0 },
  { name: 'یخچال و بخاری و هیتر های مسافرتی', slug: 'heater-fridge', sortOrder: 1 },
  { name: 'چادر و کیسه خواب و لباس های کمپی', slug: 'tent', sortOrder: 2 },
  { name: 'لوازم روشنایی و بیسیم و مسیریاب', slug: 'directional-light', sortOrder: 3 },
  { name: 'میز و صندلی و تخت سفری', slug: 'sit-bed', sortOrder: 4 },
  { name: 'سایر', slug: 'other-camping', sortOrder: 5 },
] as const;

/** Subgroups under the car-brands library (e.g. camper vehicles). */
export const DEFAULT_CAR_BRAND_SUBGROUPS = [
  { name: 'ماشین های کمپری', slug: 'camper-cars', sortOrder: 1 },
] as const;

/** Default car brand entries (slug = URL id, code = product filter code). */
export const DEFAULT_CAR_BRANDS = [
  {
    name: 'تویوتا',
    slug: 'toyota',
    code: 'TOYOTA',
    parentSlug: null as string | null,
    sortOrder: 1,
  },
  { name: 'نیسان', slug: 'nissan', code: 'NISSAN', parentSlug: null, sortOrder: 2 },
  { name: 'میتسوبیشی', slug: 'mitsubishi', code: 'MITSUBISHI', parentSlug: null, sortOrder: 3 },
  { name: 'مرسدس‌بنز', slug: 'mercedes', code: 'MERCEDES', parentSlug: null, sortOrder: 4 },
  { name: 'فورد', slug: 'ford', code: 'FORD', parentSlug: null, sortOrder: 5 },
  { name: 'سوزوکی', slug: 'suzuki', code: 'SUZUKI', parentSlug: null, sortOrder: 6 },
  { name: 'جک', slug: 'jac', code: 'JAC', parentSlug: null, sortOrder: 7 },
  { name: 'هاوال', slug: 'haval', code: 'HAVAL', parentSlug: null, sortOrder: 8 },
  { name: 'هیوندای', slug: 'hyundai', code: 'HYUNDAI', parentSlug: null, sortOrder: 9 },
  { name: 'کیا', slug: 'kia', code: 'KIA', parentSlug: null, sortOrder: 10 },
  { name: 'لندروور', slug: 'land-rover', code: 'LAND_ROVER', parentSlug: null, sortOrder: 11 },
  { name: 'لکسوس', slug: 'lexus', code: 'LEXUS', parentSlug: null, sortOrder: 12 },
  { name: 'رنو', slug: 'renault', code: 'RENAULT', parentSlug: null, sortOrder: 13 },
  { name: 'ولوو', slug: 'volvo', code: 'VOLVO', parentSlug: null, sortOrder: 14 },
  { name: 'جیپ', slug: 'jeep', code: 'JEEP', parentSlug: null, sortOrder: 15 },
  { name: 'سایر', slug: 'other', code: 'OTHER', parentSlug: null, sortOrder: 16 },
] as const;
