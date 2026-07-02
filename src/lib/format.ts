import { LOCALE } from "./constants";

const inr = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const inrDecimal = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const num = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });

interface MoneyOptions {
  decimals?: boolean;
  signed?: boolean;
  absolute?: boolean;
}

/** Format a rupee amount, e.g. `₹1,23,456`. */
export function money(value: number, opts: MoneyOptions = {}): string {
  const { decimals = false, signed = false, absolute = false } = opts;
  let v = value ?? 0;
  if (absolute) v = Math.abs(v);
  const formatter = decimals ? inrDecimal : inr;
  const base = formatter.format(Math.abs(v));
  if (signed && v !== 0) return `${v > 0 ? "+" : "−"}${base}`;
  if (v < 0 && !absolute) return `−${base}`;
  return base;
}

/** Compact rupee amount for dense charts, e.g. `₹1.2L`, `₹4.5k`. */
export function moneyShort(value: number): string {
  const v = Math.abs(value);
  const sign = value < 0 ? "−" : "";
  if (v >= 1e7) return `${sign}₹${trim(v / 1e7)}Cr`;
  if (v >= 1e5) return `${sign}₹${trim(v / 1e5)}L`;
  if (v >= 1e3) return `${sign}₹${trim(v / 1e3)}k`;
  return `${sign}₹${num.format(Math.round(v))}`;
}

function trim(n: number): string {
  return n.toFixed(n < 10 ? 1 : 0).replace(/\.0$/, "");
}

export function plainNumber(value: number): string {
  return num.format(value);
}

export function percent(ratio: number, digits = 0): string {
  return `${(ratio * 100).toFixed(digits)}%`;
}

/* ----------------------------- dates ------------------------------ */

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Local `YYYY-MM` key for a date (or now). */
export function monthKey(date: Date | number = new Date()): string {
  const d = typeof date === "number" ? new Date(date) : date;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function currentMonthKey(): string {
  return monthKey(new Date());
}

/** "2025-07" -> "July 2025". */
export function monthLabel(key: string, short = false): string {
  const [y, m] = key.split("-").map(Number);
  const names = short ? MONTHS_SHORT : MONTHS;
  return `${names[m - 1]} ${y}`;
}

export function shiftMonth(key: string, delta: number): string {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return monthKey(d);
}

export function isCurrentMonth(key: string): boolean {
  return key === currentMonthKey();
}

/** A human date like "3 Jul 2025". */
export function formatDate(value: number | Date): string {
  const d = typeof value === "number" ? new Date(value) : value;
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

/** Short date "3 Jul". */
export function formatDateShort(value: number | Date): string {
  const d = typeof value === "number" ? new Date(value) : value;
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

const rtf = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" });

/** Relative label ("Today", "Yesterday", "3 days ago", else short date). */
export function relativeDay(value: number | Date): string {
  const d = typeof value === "number" ? new Date(value) : value;
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOfDay(d) - startOfDay(new Date())) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === -1) return "Yesterday";
  if (diffDays > -7 && diffDays < 0) return rtf.format(diffDays, "day");
  return formatDate(d);
}

/** For a datetime-local / date input default value (local, no tz shift). */
export function toDateInputValue(value: number | Date): string {
  const d = typeof value === "number" ? new Date(value) : value;
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60_000).toISOString().slice(0, 10);
}

export function fromDateInputValue(value: string): number {
  // Interpret as local noon to avoid tz edge cases flipping the day.
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0).getTime();
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
