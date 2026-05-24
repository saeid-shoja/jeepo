import { BadRequestException } from '@nestjs/common';
import { CarBrand } from '../prisma/generated/client';

export const CAR_BRAND_LABELS: Record<CarBrand, string> = {
  TOYOTA: 'تویوتا',
  NISSAN: 'نیسان',
  MITSUBISHI: 'میتسوبیشی',
  MERCEDES: 'مرسدس‌بنز',
  FORD: 'فورد',
  SUZUKI: 'سوزوکی',
  JAC: 'جک',
  HAVAL: 'هاوال',
  HYUNDAI: 'هیوندای',
  KIA: 'کیا',
  LAND_ROVER: 'لندروور',
  LEXUS: 'لکسوس',
  RENAULT: 'رنو',
  VOLVO: 'ولوو',
  JEEP: 'جیپ',
  OTHER: 'سایر',
};

const CAR_BRAND_VALUES = Object.keys(CAR_BRAND_LABELS) as CarBrand[];

export function getCarBrandOptions() {
  return CAR_BRAND_VALUES.map((value) => ({
    value,
    label: CAR_BRAND_LABELS[value],
  }));
}

export function getCarBrandLabel(brand: CarBrand): string {
  return CAR_BRAND_LABELS[brand] ?? brand;
}

function isCarBrand(value: string): value is CarBrand {
  return CAR_BRAND_VALUES.includes(value as CarBrand);
}

export function parseCarBrands(brands?: string[]): CarBrand[] {
  if (!brands?.length) return [];

  const unique = [...new Set(brands)];
  const invalid = unique.filter((b) => !isCarBrand(b));
  if (invalid.length > 0) {
    throw new BadRequestException(
      'برند خودرو نامعتبر است. فقط از لیست مجاز انتخاب کنید.',
    );
  }

  return unique as CarBrand[];
}
