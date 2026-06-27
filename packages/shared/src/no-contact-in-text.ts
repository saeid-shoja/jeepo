/** Detect URLs and phone numbers in listing title/description. */
const LINK_PATTERN =
  /(?:https?:\/\/|www\.)\S+|\b[a-z0-9-]+(?:\.[a-z0-9-]+)+\.(?:com|ir|net|org|co|io|me|app|dev|shop|store|link|site)\b/i;

const PHONE_PATTERN =
  /\b(?:\+?98[\s\-./]?)?0?9[\s\-./]?\d{2}[\s\-./]?\d{3}[\s\-./]?\d{4}\b|\b0\d{2,3}[\s\-./]?\d{7,8}\b/;

export const NO_CONTACT_IN_TEXT_MESSAGE =
  'استفاده از لینک یا شماره تماس در عنوان و توضیحات مجاز نیست';

export function containsLinkOrPhone(text: string): boolean {
  const value = text.trim();
  if (!value) return false;
  return LINK_PATTERN.test(value) || PHONE_PATTERN.test(value);
}
