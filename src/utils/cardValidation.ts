/**
 * Client-side card form validation + mock-token mapping.
 *
 * SECURITY: The PAN, expiry and CVV typed into the card form are validated
 * locally and then DISCARDED. They are never sent to the API, logged, or
 * persisted. The only thing that reaches `POST /payments` is a lowercase mock
 * token (see `MockPaymentToken`) chosen by `mapCardToMockToken`.
 *
 * Test numbers recognised by the mock provider (documented here on purpose):
 *   4242 4242 4242 4242  → mock_visa_success
 *   5555 5555 5555 4444  → mock_mastercard_success
 *   4000 0000 0000 0002  → mock_card_declined
 * Any other Luhn-valid Visa / Mastercard number maps to that brand's success
 * token, because the backend provider is a mock — it is never a real charge.
 *
 * This file is dependency-free so `scripts/card-validation-selftest.mjs` can
 * import it directly.
 */

export type CardBrand = 'visa' | 'mastercard';

export type MockPaymentToken =
  | 'mock_visa_success'
  | 'mock_mastercard_success'
  | 'mock_card_declined'
  | 'mock_apple_pay_success'
  | 'mock_apple_pay_declined';

export const MOCK_DECLINED_CARD_NUMBER = '4000000000000002';

const MAX_PAN_LENGTH = 16;
const MIN_PAN_LENGTH = 13;

export function digitsOnly(value: string | null | undefined): string {
  return (value ?? '').replace(/\D/g, '');
}

/** Luhn checksum over a digit string. */
export function luhnValid(value: string): boolean {
  const digits = digitsOnly(value);
  if (digits.length < MIN_PAN_LENGTH || digits.length > 19) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let n = digits.charCodeAt(i) - 48;
    if (double) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    double = !double;
  }
  return sum % 10 === 0;
}

/** Visa (4…) and Mastercard (51–55, 2221–2720). Everything else → null. */
export function detectCardBrand(value: string): CardBrand | null {
  const digits = digitsOnly(value);
  if (!digits) return null;
  if (digits[0] === '4') return 'visa';
  const two = Number(digits.slice(0, 2));
  if (digits.length >= 2 && two >= 51 && two <= 55) return 'mastercard';
  const four = Number(digits.slice(0, 4));
  if (digits.length >= 4 && four >= 2221 && four <= 2720) return 'mastercard';
  return null;
}

/** `4242424242424242` → `4242 4242 4242 4242` (digits capped at 16). */
export function formatCardNumber(value: string): string {
  const digits = digitsOnly(value).slice(0, MAX_PAN_LENGTH);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

/** Live-format expiry input into `MM/YY`. */
export function formatExpiryInput(value: string): string {
  const digits = digitsOnly(value).slice(0, 4);
  if (digits.length === 0) return '';
  if (digits.length === 1) {
    // "2".."9" can only be a month → pad to 02..09.
    return Number(digits) > 1 ? `0${digits}` : digits;
  }
  const month = digits.slice(0, 2);
  const rest = digits.slice(2);
  return rest ? `${month}/${rest}` : month;
}

export function cvvDigits(value: string): string {
  return digitsOnly(value).slice(0, 4);
}

export function validateCardholderName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return 'Enter the cardholder name';
  if (trimmed.length < 2) return 'Enter the full cardholder name';
  if (trimmed.length > 60) return 'Cardholder name is too long';
  return null;
}

export function validateCardNumber(value: string): string | null {
  const digits = digitsOnly(value);
  if (!digits) return 'Enter the card number';
  if (digits.length < MIN_PAN_LENGTH) return 'Card number is too short';
  if (!luhnValid(digits)) return 'Card number is not valid';
  if (!detectCardBrand(digits)) return 'Only Visa and Mastercard are supported';
  return null;
}

/**
 * `MM/YY`, month 01–12, not expired (valid through the last day of the month).
 * `now` is injectable for tests.
 */
export function validateExpiry(
  value: string,
  now: Date = new Date(),
): string | null {
  const match = /^(\d{2})\/(\d{2})$/.exec(value.trim());
  if (!match) return 'Use MM/YY';
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return 'Month must be 01–12';
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return 'This card has expired';
  }
  if (year > currentYear + 20) return 'Expiry year is too far ahead';
  return null;
}

/** 3–4 digits. */
export function validateCvv(value: string): string | null {
  const digits = digitsOnly(value);
  if (!digits) return 'Enter the CVV';
  if (digits.length < 3 || digits.length > 4) return 'CVV must be 3 or 4 digits';
  return null;
}

export interface CardFormInput {
  cardholder: string;
  number: string;
  expiry: string;
  cvv: string;
}

export interface CardFormErrors {
  cardholder: string | null;
  number: string | null;
  expiry: string | null;
  cvv: string | null;
}

export function validateCardForm(
  input: CardFormInput,
  now: Date = new Date(),
): CardFormErrors {
  return {
    cardholder: validateCardholderName(input.cardholder),
    number: validateCardNumber(input.number),
    expiry: validateExpiry(input.expiry, now),
    cvv: validateCvv(input.cvv),
  };
}

export function cardFormHasErrors(errors: CardFormErrors): boolean {
  return Object.values(errors).some(Boolean);
}

/**
 * Map a (validated) card number to the mock provider token. Returns null for
 * numbers that are not a recognised Visa / Mastercard. The number itself is
 * never returned or transmitted.
 */
export function mapCardToMockToken(
  value: string,
): Extract<
  MockPaymentToken,
  'mock_visa_success' | 'mock_mastercard_success' | 'mock_card_declined'
> | null {
  const digits = digitsOnly(value);
  if (digits === MOCK_DECLINED_CARD_NUMBER) return 'mock_card_declined';
  const brand = detectCardBrand(digits);
  if (brand === 'visa') return 'mock_visa_success';
  if (brand === 'mastercard') return 'mock_mastercard_success';
  return null;
}
