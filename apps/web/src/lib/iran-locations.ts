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
