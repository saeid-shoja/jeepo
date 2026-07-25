import { Iran } from 'provinces-and-cities';

/** Resolve province name from a city label stored on products (e.g. «تهران» → «تهران»). */
export function findProvinceNameByCity(city?: string | null): string | undefined {
  const normalized = city?.trim();
  if (!normalized) return undefined;

  for (const province of Iran.main) {
    if (province.cities.some((name) => name === normalized)) {
      return province.name;
    }
  }

  return undefined;
}
