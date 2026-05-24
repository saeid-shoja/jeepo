export const CAR_BRAND_VALUES = [
  'TOYOTA',
  'NISSAN',
  'MITSUBISHI',
  'MERCEDES',
  'FORD',
  'SUZUKI',
  'JAC',
  'HAVAL',
  'HYUNDAI',
  'KIA',
  'LAND_ROVER',
  'LEXUS',
  'RENAULT',
  'VOLVO',
  'JEEP',
  'OTHER',
] as const;

export type CarBrand = (typeof CAR_BRAND_VALUES)[number];

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

export function getCarBrandOptions() {
  return CAR_BRAND_VALUES.map((value) => ({
    value,
    label: CAR_BRAND_LABELS[value],
  }));
}

export function getCarBrandLabel(brand: CarBrand): string {
  return CAR_BRAND_LABELS[brand] ?? brand;
}

export function isCarBrand(value: string): value is CarBrand {
  return (CAR_BRAND_VALUES as readonly string[]).includes(value);
}
