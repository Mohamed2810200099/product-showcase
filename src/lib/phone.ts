/**
 * Normalize Egyptian phone numbers to a consistent local format: 01xxxxxxxxx.
 * - Removes spaces, dashes, parentheses, plus signs, and other non-digits.
 * - Handles +20 / 0020 / 20 country prefixes.
 * - Returns digits-only output. May not be a valid number — pair with isValidEgyptPhone.
 */
export function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return "";
  // Keep digits only
  let d = String(phone).replace(/\D+/g, "");
  if (!d) return "";

  // 0020XXXXXXXXXX  → 0XXXXXXXXXX
  if (d.startsWith("0020")) d = "0" + d.slice(4);
  // 20XXXXXXXXXX (12 digits) → 0XXXXXXXXXX
  else if (d.startsWith("20") && d.length === 12) d = "0" + d.slice(2);
  // 1XXXXXXXXX (10 digits, missing leading 0) → 01XXXXXXXXX
  else if (d.length === 10 && d.startsWith("1")) d = "0" + d;

  return d;
}

/** Egyptian mobile pattern: 11 digits starting with 010, 011, 012, or 015. */
export function isValidEgyptPhone(phone: string | null | undefined): boolean {
  const n = normalizePhone(phone);
  return /^01[0125]\d{8}$/.test(n);
}

/** Pretty display: 0100 000 0000 — does not change stored value. */
export function formatPhoneDisplay(phone: string | null | undefined): string {
  const n = normalizePhone(phone);
  if (n.length !== 11) return phone ?? "";
  return `${n.slice(0, 4)} ${n.slice(4, 7)} ${n.slice(7)}`;
}
