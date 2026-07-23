/** Shared parsing/formatting for numeric text inputs (no leading-zero traps). */

export function digitsOnly(raw: string): string {
  return raw.replace(/\D/g, "");
}

/** Strip leading zeros; empty stays empty. "055" → "55", "0" → "0". */
export function normalizeIntegerDigits(digits: string): string {
  if (digits === "") return "";
  return String(Number(digits));
}

export function formatWithCommas(n: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
}

export function parseIntegerInput(raw: string): {
  display: string;
  value: number | null;
} {
  const digits = digitsOnly(raw);
  if (digits === "") return { display: "", value: null };
  const value = Number(digits);
  if (!Number.isFinite(value)) return { display: "", value: null };
  return { display: String(value), value };
}

/** Whole-dollar money input with thousands separators while typing. */
export function parseMoneyInput(raw: string): {
  display: string;
  value: number | null;
} {
  const digits = digitsOnly(raw);
  if (digits === "") return { display: "", value: null };
  const value = Number(digits);
  if (!Number.isFinite(value)) return { display: "", value: null };
  return { display: formatWithCommas(value), value };
}

export function moneyToDisplay(
  value: number | null | undefined,
  emptyWhenZero = false,
): string {
  if (value == null || !Number.isFinite(value)) return "";
  if (emptyWhenZero && value === 0) return "";
  return formatWithCommas(value);
}

export function integerToDisplay(
  value: number | null | undefined,
  emptyWhenZero = false,
): string {
  if (value == null || !Number.isFinite(value)) return "";
  if (emptyWhenZero && value === 0) return "";
  return String(value);
}
