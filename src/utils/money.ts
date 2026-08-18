export {
  formatMoneyDisplay as formatMoney,
  formatMoneyDisplay,
  roundMoneyAmount,
} from '../data/location/geo';

export { stripCurrencyGlyphs } from './currency';

/**
 * Parse a monetary amount from a display/API label without treating the
 * decimal point as a digit. "SAR 900.00" → 900; never 90000.
 *
 * Accepts labels like "SAR 900.00", "Dhs 1,250.50", "+ 280", "900".
 */
export function parseMoneyAmountFromLabel(
  label: string | null | undefined,
): number | null {
  if (typeof label !== 'string') return null;
  const match = label.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const amount = Number(match[0]);
  if (!Number.isFinite(amount)) return null;
  return Math.round(amount * 100) / 100;
}

/** Draft/input string for edit forms: major units, no currency prefix. */
export function moneyAmountDraftFromLabel(
  label: string | null | undefined,
): string {
  const amount = parseMoneyAmountFromLabel(label);
  if (amount === null) return '0';
  // Prefer integer string when the value is whole (matches existing digit inputs).
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
}
