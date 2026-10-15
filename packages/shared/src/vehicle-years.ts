export const MIN_VEHICLE_PRODUCTION_YEAR = 1370;

export const VEHICLE_GEARBOXES = [
  { value: "MANUAL", label: "دنده‌ای" },
  { value: "AUTOMATIC", label: "اتومات" },
] as const;

export type VehicleGearbox = (typeof VEHICLE_GEARBOXES)[number]["value"];

export function formatVehicleProductionYear(
  solarYear: number,
  gregorianYear = solarYear + 621,
) {
  const formatYear = (year: number) =>
    year.toLocaleString("fa-IR", { useGrouping: false });
  return `${formatYear(solarYear)}/${formatYear(gregorianYear)}`;
}

export function parseVehicleProductionYear(value: string | null | undefined) {
  const match = value?.match(/^(\d{4})\/(\d{4})$/);
  if (!match) return null;
  return { solarYear: Number(match[1]), gregorianYear: Number(match[2]) };
}

export function isValidVehicleProductionYear(
  value: string | null | undefined,
  date = new Date(),
) {
  const parsed = parseVehicleProductionYear(value);
  return Boolean(
    parsed &&
    parsed.solarYear >= MIN_VEHICLE_PRODUCTION_YEAR &&
    parsed.solarYear <= getCurrentSolarYear(date) &&
    parsed.gregorianYear === parsed.solarYear + 621,
  );
}

export function getCurrentSolarYear(date = new Date()): number {
  const yearPart = new Intl.DateTimeFormat("en-US-u-ca-persian", {
    year: "numeric",
  })
    .formatToParts(date)
    .find((part) => part.type === "year");
  const year = Number(yearPart?.value);
  return Number.isInteger(year) ? year : date.getFullYear() - 621;
}

export function getVehicleProductionYearOptions(date = new Date()) {
  const currentYear = getCurrentSolarYear(date);
  return Array.from(
    { length: Math.max(0, currentYear - MIN_VEHICLE_PRODUCTION_YEAR + 1) },
    (_, index) => {
      const solarYear = MIN_VEHICLE_PRODUCTION_YEAR + index;
      return { solarYear, gregorianYear: solarYear + 621 };
    },
  );
}
