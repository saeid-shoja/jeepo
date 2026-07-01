const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

/** Convert Persian / Arabic-Indic numerals to ASCII digits (0-9). */
export function toEnglishDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)));
}

/** Normalize login identifier: keep emails as-is, convert phone digits to ASCII. */
export function normalizeLoginIdentifier(value: string): string {
  const trimmed = value.trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  return toEnglishDigits(trimmed).trim();
}

/** Normalize Telegram id: usernames unchanged, numeric ids converted to ASCII digits. */
export function normalizeTelegramIdInput(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  if (/^@?[a-zA-Z]/.test(trimmed)) return trimmed;
  return toEnglishDigits(trimmed);
}
