/**
 * Location → currency helpers for price UI.
 * Screens render CurrencyIcon + a glyph-stripped numeric label rather than embedding ﷼/⃁ in strings.
 */

export type AppCurrency = 'SAR' | 'AED';

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
 * Map profile location → local currency.
 * Any UAE city/country string → AED (Dirham); otherwise SAR (Riyal).
 */
export function resolveCurrencyFromLocation(location?: string | null): AppCurrency {
  if (!location) return 'SAR';
  const normalized = location.trim().toLowerCase();
  if (UAE_LOCATION_MARKERS.some((marker) => normalized.includes(marker))) {
    return 'AED';
  }
  return 'SAR';
}
