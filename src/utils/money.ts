export {
  formatMoneyDisplay as formatMoney,
  formatMoneyDisplay,
  roundMoneyAmount,
} from '../data/location/geo';

export { stripCurrencyGlyphs } from './currency';

import type { CurrencyCode } from '../data/location/geo';
import { roundMoneyAmount } from '../data/location/geo';

/**
 * Parse a monetary amount from a display/API label without treating the
 * decimal point as a digit. "SAR 900.00" → 900; never 90000.
 *
 * Accepts labels like "SAR 900.00", "Dhs 1,284.87", "+ 280", "900".
 * Empty / non-numeric → null.
 */
export function parseMoneyAmountFromLabel(
  label: string | null | undefined,
): number | null {
  if (typeof label !== 'string') return null;
  const trimmed = label.trim();
  if (!trimmed) return null;
  const match = trimmed.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const amount = Number(match[0]);
  if (!Number.isFinite(amount)) return null;
  return roundMoneyAmount(amount);
}

/** Draft/input string for edit forms: major units, no currency prefix. */
export function moneyAmountDraftFromLabel(
  label: string | null | undefined,
): string {
  const amount = parseMoneyAmountFromLabel(label);
  if (amount === null) return '';
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
}

/**
 * Amount-only display (no SAR/Dhs prefix). Always two decimal places with
 * thousands separators: 500.00 · 1,284.87 · 10,000.00
 */
export function formatMoneyAmountDigits(
  amount: number | null | undefined,
): string {
  if (amount == null || !Number.isFinite(amount)) return '';
  return roundMoneyAmount(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Strip SAR / AED / Dhs tokens from free-text salary labels so an icon can
 * carry the currency instead of plain text prefixes.
 */
export function stripCurrencyCodeTokens(label: string): string {
  return label
    .replace(/\b(SAR|AED|Dhs)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Live editing normalizer for money TextInputs.
 * - Allows temporary empty string while clearing/retyping
 * - Digits + at most one decimal point
 * - Max 2 decimal places
 * - No live thousands commas (avoids cursor jumps)
 * - Does not coerce empty → "0"
 */
export function normalizeMoneyInputEditing(text: string): string {
  const cleaned = text.replace(/[^\d.]/g, '');
  if (!cleaned) return '';

  const firstDot = cleaned.indexOf('.');
  let whole: string;
  let fraction: string | null = null;
  if (firstDot === -1) {
    whole = cleaned;
  } else {
    whole = cleaned.slice(0, firstDot);
    fraction = cleaned
      .slice(firstDot + 1)
      .replace(/\./g, '')
      .slice(0, 2);
  }

  whole = whole.replace(/^0+(?=\d)/, '');
  if (firstDot === -1) return whole;
  if (fraction === null || fraction.length === 0) {
    // Keep trailing "." while the user is typing decimals (e.g. "1284.").
    return `${whole || '0'}.`;
  }
  return `${whole || '0'}.${fraction}`;
}

/**
 * Parse an in-progress or submitted money input.
 * Empty / whitespace → null (not 0).
 * Invalid / non-positive → null when `requirePositive` (default true).
 */
export function parseMoneyInput(
  text: string | null | undefined,
  opts?: { requirePositive?: boolean },
): number | null {
  if (typeof text !== 'string') return null;
  const trimmed = text.trim();
  if (!trimmed || trimmed === '.') return null;
  const normalized = trimmed.replace(/,/g, '');
  // Reject more than 2 decimal places rather than silently truncating.
  if (/\.\d{3,}$/.test(normalized)) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const amount = Number(normalized);
  if (!Number.isFinite(amount)) return null;
  const requirePositive = opts?.requirePositive !== false;
  if (requirePositive && amount <= 0) return null;
  if (amount < 0) return null;
  return roundMoneyAmount(amount);
}

export function toCurrencyCode(
  value: string | null | undefined,
): CurrencyCode | null {
  if (!value) return null;
  const raw = value.trim().toUpperCase();
  if (raw === 'SAR' || raw === 'AED') return raw;
  return null;
}

/** Prefer the commercial object's snapshotted currency over a profile default. */
export function resolveObjectCurrency(
  objectCurrency: string | null | undefined,
  fallbackDefault?: string | null | undefined,
): CurrencyCode | null {
  return toCurrencyCode(objectCurrency) ?? toCurrencyCode(fallbackDefault);
}
