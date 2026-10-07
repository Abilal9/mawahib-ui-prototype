/**
 * Card validation selftest (no network). Imports the real TypeScript module,
 * so it needs a Node that can strip types (>= 22.18, or 22.6+ with
 * --experimental-strip-types).
 * Run: node scripts/card-validation-selftest.mjs
 */
import assert from 'node:assert/strict';

let cv;
try {
  cv = await import('../src/utils/cardValidation.ts');
} catch (e) {
  console.error(
    'card-validation-selftest: could not import the TS module. Use Node >= 22.18 (current: ' +
      process.version +
      ').',
  );
  throw e;
}

// ── Luhn ────────────────────────────────────────────────────────────────────
assert.equal(cv.luhnValid('4242424242424242'), true);
assert.equal(cv.luhnValid('4242 4242 4242 4242'), true);
assert.equal(cv.luhnValid('5555555555554444'), true);
assert.equal(cv.luhnValid('4000000000000002'), true);
assert.equal(cv.luhnValid('4242424242424241'), false);
assert.equal(cv.luhnValid('1234'), false);
assert.equal(cv.luhnValid(''), false);

// ── Brand detection ─────────────────────────────────────────────────────────
assert.equal(cv.detectCardBrand('4242'), 'visa');
assert.equal(cv.detectCardBrand('5555 5555'), 'mastercard');
assert.equal(cv.detectCardBrand('5105105105105100'), 'mastercard');
assert.equal(cv.detectCardBrand('2221000000000009'), 'mastercard');
assert.equal(cv.detectCardBrand('2720999999999996'), 'mastercard');
assert.equal(cv.detectCardBrand('2721000000000000'), null);
assert.equal(cv.detectCardBrand('5000'), null);
assert.equal(cv.detectCardBrand('378282246310005'), null); // Amex unsupported
assert.equal(cv.detectCardBrand(''), null);

// ── Formatting ──────────────────────────────────────────────────────────────
assert.equal(cv.formatCardNumber('4242424242424242'), '4242 4242 4242 4242');
assert.equal(cv.formatCardNumber('42424'), '4242 4');
assert.equal(cv.formatCardNumber('4242-4242 4242abc4242 99'), '4242 4242 4242 4242');
assert.equal(cv.formatExpiryInput('1'), '1');
assert.equal(cv.formatExpiryInput('2'), '02');
assert.equal(cv.formatExpiryInput('12'), '12');
assert.equal(cv.formatExpiryInput('123'), '12/3');
assert.equal(cv.formatExpiryInput('1228'), '12/28');
assert.equal(cv.formatExpiryInput('12/28'), '12/28');
assert.equal(cv.formatExpiryInput('122899'), '12/28');
assert.equal(cv.cvvDigits('12a345'), '1234');

// ── Expiry (fixed "now": 15 Mar 2026) ───────────────────────────────────────
const now = new Date(2026, 2, 15);
assert.equal(cv.validateExpiry('03/26', now), null); // current month still valid
assert.equal(cv.validateExpiry('12/28', now), null);
assert.equal(cv.validateExpiry('02/26', now), 'This card has expired');
assert.equal(cv.validateExpiry('12/25', now), 'This card has expired');
assert.equal(cv.validateExpiry('13/28', now), 'Month must be 01–12');
assert.equal(cv.validateExpiry('00/28', now), 'Month must be 01–12');
assert.equal(cv.validateExpiry('1228', now), 'Use MM/YY');
assert.equal(cv.validateExpiry('', now), 'Use MM/YY');
assert.equal(cv.validateExpiry('12/99', now), 'Expiry year is too far ahead');

// ── CVV ─────────────────────────────────────────────────────────────────────
assert.equal(cv.validateCvv('123'), null);
assert.equal(cv.validateCvv('1234'), null);
assert.notEqual(cv.validateCvv('12'), null);
assert.notEqual(cv.validateCvv('12345'), null);
assert.notEqual(cv.validateCvv(''), null);

// ── Cardholder ──────────────────────────────────────────────────────────────
assert.equal(cv.validateCardholderName('Sara Ahmed'), null);
assert.notEqual(cv.validateCardholderName('  '), null);
assert.notEqual(cv.validateCardholderName('A'), null);

// ── Card number rules ───────────────────────────────────────────────────────
assert.equal(cv.validateCardNumber('4242 4242 4242 4242'), null);
assert.equal(cv.validateCardNumber('5555 5555 5555 4444'), null);
assert.notEqual(cv.validateCardNumber('4242 4242 4242 4241'), null);
assert.notEqual(cv.validateCardNumber('3782 8224 6310 005'), null); // valid Luhn, not Visa/MC
assert.notEqual(cv.validateCardNumber(''), null);

// ── Mock token mapping ──────────────────────────────────────────────────────
assert.equal(cv.mapCardToMockToken('4242 4242 4242 4242'), 'mock_visa_success');
assert.equal(cv.mapCardToMockToken('5555555555554444'), 'mock_mastercard_success');
assert.equal(cv.mapCardToMockToken('4000 0000 0000 0002'), 'mock_card_declined');
assert.equal(cv.mapCardToMockToken('3782 8224 6310 005'), null);
assert.equal(cv.mapCardToMockToken(''), null);

// Tokens must satisfy the backend pattern and never contain card data.
for (const n of ['4242424242424242', '5555555555554444', '4000000000000002']) {
  const token = cv.mapCardToMockToken(n);
  assert.match(token, /^[a-z0-9_]+$/);
  assert.equal(token.includes(n), false);
}

// ── Whole-form validation ───────────────────────────────────────────────────
const ok = cv.validateCardForm(
  { cardholder: 'Sara Ahmed', number: '4242 4242 4242 4242', expiry: '12/28', cvv: '123' },
  now,
);
assert.equal(cv.cardFormHasErrors(ok), false);
const bad = cv.validateCardForm(
  { cardholder: '', number: '1111', expiry: '1/1', cvv: '1' },
  now,
);
assert.equal(cv.cardFormHasErrors(bad), true);
assert.ok(bad.cardholder && bad.number && bad.expiry && bad.cvv);

console.log('card-validation-selftest: OK');
