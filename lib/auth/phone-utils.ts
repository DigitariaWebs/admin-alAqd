export function normalizePhoneNumber(value: string): string {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return "";
  return `+${digits}`;
}

/**
 * Build a regex that matches a phone number by its digits alone,
 * ignoring any formatting characters (spaces, dashes, parens, dots).
 */
export function buildPhoneDigitsRegex(normalizedPhone: string): RegExp {
  const digits = normalizedPhone.replace(/\D/g, "");
  const pattern = digits.split("").join("\\D*");
  return new RegExp(`^\\+?\\D*${pattern}\\D*$`);
}
