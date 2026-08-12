import {
  parsePhoneNumberFromString,
  type CountryCode,
} from 'libphonenumber-js';

export type DialCountry = {
  code: CountryCode;
  name: string;
  dial: string;
  flag: string;
};

/** GCC-first list for Mawahib; expandable later. */
export const DIAL_COUNTRIES: DialCountry[] = [
  { code: 'SA', name: 'Saudi Arabia', dial: '+966', flag: '🇸🇦' },
  { code: 'AE', name: 'United Arab Emirates', dial: '+971', flag: '🇦🇪' },
  { code: 'KW', name: 'Kuwait', dial: '+965', flag: '🇰🇼' },
  { code: 'BH', name: 'Bahrain', dial: '+973', flag: '🇧🇭' },
  { code: 'QA', name: 'Qatar', dial: '+974', flag: '🇶🇦' },
  { code: 'OM', name: 'Oman', dial: '+968', flag: '🇴🇲' },
  { code: 'EG', name: 'Egypt', dial: '+20', flag: '🇪🇬' },
  { code: 'JO', name: 'Jordan', dial: '+962', flag: '🇯🇴' },
  { code: 'US', name: 'United States', dial: '+1', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', dial: '+44', flag: '🇬🇧' },
];

/** Saudi mobile local format: 5XXXXXXXX (9 digits). */
const SA_MOBILE_NATIONAL = /^5\d{8}$/;

/**
 * Max national digits accepted in the input.
 * SA is fixed at 9; other countries use a generous E.164-safe cap
 * (libphonenumber still decides validity).
 */
export function maxNationalDigits(country: CountryCode): number {
  if (country === 'SA') return 9;
  return 15;
}

/** Digits only, capped to the country max (blocks 10th SA digit, letters, etc.). */
export function sanitizeNationalInput(
  raw: string,
  country: CountryCode,
): string {
  return raw.replace(/\D/g, '').slice(0, maxNationalDigits(country));
}

export function toE164(
  nationalNumber: string,
  country: CountryCode,
): string | null {
  const digits = sanitizeNationalInput(nationalNumber, country);
  if (!digits) return null;

  if (country === 'SA') {
    if (!SA_MOBILE_NATIONAL.test(digits)) return null;
    return `+966${digits}`;
  }

  const parsed = parsePhoneNumberFromString(digits, country);
  if (!parsed || !parsed.isValid()) return null;
  return parsed.format('E.164');
}

export function isValidNationalNumber(
  nationalNumber: string,
  country: CountryCode,
): boolean {
  return toE164(nationalNumber, country) !== null;
}

/**
 * Live UX messages. Saudi rules only when country is SA (+966).
 * Returns null when empty or valid.
 */
export function getPhoneValidationMessage(
  nationalNumber: string,
  country: CountryCode,
): string | null {
  const digits = sanitizeNationalInput(nationalNumber, country);
  if (!digits) return null;

  if (country === 'SA') {
    if (digits[0] !== '5') {
      return 'Saudi mobile numbers must start with 5';
    }
    if (digits.length < 9) {
      return 'Enter a 9-digit mobile number';
    }
    return null;
  }

  if (!toE164(digits, country)) {
    return 'Enter a valid phone number for the selected country';
  }
  return null;
}

export function formatNationalHint(country: CountryCode): string {
  switch (country) {
    case 'SA':
      return '5XXXXXXXX';
    case 'AE':
      return '5X XXX XXXX';
    default:
      return 'Phone number';
  }
}
