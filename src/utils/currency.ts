/**
 * Location → currency helpers for price UI.
 * Prefer explicit currency codes; fall back to location heuristics for legacy rows.
 */

import {
  type CurrencyCode,
  normalizeCurrencyCode,
} from '../data/location/geo';

export type AppCurrency = CurrencyCode;

/** Substrings matched (case-insensitive) against a profile location to pick AED. */
const UAE_LOCATION_MARKERS = [
  'uae',
  'united arab emirates',
  'emirates',
  'dubai',
  'abu dhabi',
  'sharjah',
  'ajman',
  'ras al khaimah',
  'ras al-khaimah',
  'fujairah',
  'umm al quwain',
  'umm al-quwain',
  'al ain',
];

/** Strip legacy Arabic / currency glyph prefixes from stored price labels. */
export function stripCurrencyGlyphs(label: string) {
  return label.replace(/[﷼⃁]/g, '').trim();
}

/**
 * Map profile location → local currency (backcompat).
 * Any UAE city/country string → AED (Dirham); otherwise SAR (Riyal).
 */
export function resolveCurrencyFromLocation(
  location?: string | null,
): AppCurrency {
  if (!location) return 'SAR';
  const normalized = location.trim().toLowerCase();
  if (UAE_LOCATION_MARKERS.some((marker) => normalized.includes(marker))) {
    return 'AED';
  }
  return 'SAR';
}

/**
 * Prefer an explicit currency code; otherwise infer from location string.
 */
export function resolveCurrencyCode(
  currency?: string | null,
  location?: string | null,
): CurrencyCode {
  if (typeof currency === 'string' && currency.trim()) {
    const normalized = currency.trim().toUpperCase();
    if (normalized === 'SAR' || normalized === 'AED') {
      return normalized;
    }
    return normalizeCurrencyCode(currency);
  }
  return resolveCurrencyFromLocation(location);
}
