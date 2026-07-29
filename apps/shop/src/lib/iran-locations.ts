import { Iran } from 'provinces-and-cities';

export type IranProvince = {
  id: number;
  name: string;
  telPrefix: string;
  cities: string[];
};

export const IRAN_PROVINCES: IranProvince[] = Iran.main.map((p) => ({
  id: p.id,
  name: p.name,
  telPrefix: p.tel_prefix,
  cities: p.cities,
}));

export function getProvinceById(id: number): IranProvince | undefined {
  return IRAN_PROVINCES.find((p) => p.id === id);
}

export function getAllIranCities(): string[] {
  const set = new Set<string>();
  for (const province of IRAN_PROVINCES) {
    for (const city of province.cities) {
      set.add(city);
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'fa'));
}

export function getProvinceNameForCity(city: string): string | null {
  return IRAN_PROVINCES.find((p) => p.cities.includes(city))?.name ?? null;
}

/** Full delivery line: استان، شهر، آدرس دقیق */
export function formatDeliveryAddress(city: string, addressDetail: string): string {
  const province = getProvinceNameForCity(city);
  return [province, city, addressDetail.trim()].filter(Boolean).join('، ');
}
