/**
 * dateUtils.ts — LATAM date helpers (dd/mm/aaaa ↔ yyyy-mm-dd)
 *
 * Rule: UI always shows/accepts dd/mm/aaaa.
 *       Backend/Firestore always stores yyyy-mm-dd (ISO date string).
 *
 * No timezone shifting: we use local Date constructor (y, m-1, d)
 * so "27/12/1990" never becomes "26/12/1990" due to UTC offset.
 */

/** "1990-12-27" → "27/12/1990"  (empty/invalid input → "") */
export function isoToDisplay(iso: string): string {
  if (!iso) return "";
  const parts = iso.split("-");
  if (parts.length !== 3) return "";
  const [y, m, d] = parts;
  if (!y || !m || !d) return "";
  return `${d}/${m}/${y}`;
}

/** "27/12/1990" → "1990-12-27"  (empty/invalid input → "") */
export function displayToIso(display: string): string {
  if (!display) return "";
  const parts = display.split("/");
  if (parts.length !== 3) return "";
  const [d, m, y] = parts;
  if (!d || !m || !y) return "";
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

/**
 * Applies a dd/mm/aaaa mask to a raw user keystroke value.
 * Strips non-digits, keeps max 8, inserts slashes automatically.
 * Use as the onChange handler: setValue(maskDateInput(e.target.value))
 */
export function maskDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/**
 * Returns true if the display-format string (dd/mm/aaaa) represents
 * a real calendar date (e.g. 30/02/1990 → false, 29/02/2000 → true).
 */
export function isValidDisplayDate(display: string): boolean {
  if (!display || display.length !== 10) return false;
  const [dd, mm, yyyy] = display.split("/");
  if (!dd || !mm || !yyyy || yyyy.length !== 4) return false;
  const d = Number(dd), m = Number(mm), y = Number(yyyy);
  if (isNaN(d) || isNaN(m) || isNaN(y)) return false;
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  if (y < 1900 || y > 2100) return false;
  // Let JS verify day is valid for the given month/year (local ctor, no UTC shift)
  const date = new Date(y, m - 1, d);
  return (
    date.getFullYear() === y &&
    date.getMonth() === m - 1 &&
    date.getDate() === d
  );
}

/**
 * Returns true if the ISO date (yyyy-mm-dd) represents an age >= 16.
 * Uses local Date constructor to avoid timezone shifts.
 */
export function validateAge16(isoDate: string): boolean {
  if (!isoDate || isoDate.length < 10) return false;
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return false;
  const birth = new Date(y, m - 1, d);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const mo = today.getMonth() - birth.getMonth();
  if (mo < 0 || (mo === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 16;
}

/**
 * Returns the latest allowed birth date for age >= 16, as ISO (yyyy-mm-dd).
 * Safe for use as `max` on a native date input or in backend validation.
 */
export function getMaxBirthDateIso(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 16);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
