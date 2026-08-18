/**
 * Lightweight regression checks for money parsing / input normalization
 * (mirrors src/utils/money.ts).
 * Run: node scripts/verify-money-parse.js
 */
function roundMoneyAmount(amount) {
  return Math.round(amount * 100) / 100;
}

function parseMoneyAmountFromLabel(label) {
  if (typeof label !== 'string') return null;
  const trimmed = label.trim();
  if (!trimmed) return null;
  const match = trimmed.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const amount = Number(match[0]);
  if (!Number.isFinite(amount)) return null;
  return roundMoneyAmount(amount);
}

function moneyAmountDraftFromLabel(label) {
  const amount = parseMoneyAmountFromLabel(label);
  if (amount === null) return '';
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
}

function formatMoneyAmountDigits(amount) {
  if (amount == null || !Number.isFinite(amount)) return '';
  return roundMoneyAmount(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function normalizeMoneyInputEditing(text) {
  const cleaned = text.replace(/[^\d.]/g, '');
  if (!cleaned) return '';

  const firstDot = cleaned.indexOf('.');
  let whole;
  let fraction = null;
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
    return `${whole || '0'}.`;
  }
  return `${whole || '0'}.${fraction}`;
}

function parseMoneyInput(text, opts) {
  if (typeof text !== 'string') return null;
  const trimmed = text.trim();
  if (!trimmed || trimmed === '.') return null;
  const normalized = trimmed.replace(/,/g, '');
  if (/\.\d{3,}$/.test(normalized)) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const amount = Number(normalized);
  if (!Number.isFinite(amount)) return null;
  const requirePositive = !opts || opts.requirePositive !== false;
  if (requirePositive && amount <= 0) return null;
  if (amount < 0) return null;
  return roundMoneyAmount(amount);
}

function formatMoneyDisplay({ amount, currency }) {
  const code = String(currency || 'SAR').toUpperCase();
  const number = formatMoneyAmountDigits(amount);
  const prefix = code === 'AED' ? 'Dhs' : 'SAR';
  return `${prefix} ${number}`;
}

const labelCases = [
  ['SAR 900.00', 900, '900'],
  ['Dhs 900.00', 900, '900'],
  ['+ 280', 280, '280'],
  ['1,250.50', 1250.5, '1250.50'],
  ['1,284.87', 1284.87, '1284.87'],
  ['', null, ''],
];
for (const [label, amt, draft] of labelCases) {
  const a = parseMoneyAmountFromLabel(label);
  const d = moneyAmountDraftFromLabel(label);
  if (a !== amt) throw new Error(`${label} amount ${a}`);
  if (d !== draft) throw new Error(`${label} draft ${d}`);
  if (d === '90000') throw new Error('900 → 90000 regression');
}

if (formatMoneyDisplay({ amount: 900, currency: 'SAR' }) !== 'SAR 900.00') {
  throw new Error('SAR display');
}
if (formatMoneyDisplay({ amount: 900, currency: 'AED' }) !== 'Dhs 900.00') {
  throw new Error('AED display');
}
if (formatMoneyAmountDigits(1284.87) !== '1,284.87') {
  throw new Error('digits format');
}
if (formatMoneyAmountDigits(1000) !== '1,000.00') {
  throw new Error('thousands digits');
}

// Empty while editing
if (normalizeMoneyInputEditing('') !== '') {
  throw new Error('empty editing');
}
if (normalizeMoneyInputEditing('abc') !== '') {
  throw new Error('letters stripped to empty');
}
if (normalizeMoneyInputEditing('1284.') !== '1284.') {
  throw new Error('trailing decimal');
}
if (normalizeMoneyInputEditing('10.555') !== '10.55') {
  throw new Error('max 2dp while typing');
}
if (normalizeMoneyInputEditing('12.3.4') !== '12.34') {
  throw new Error('multiple dots');
}

// Submit parse
if (parseMoneyInput('') !== null) throw new Error('empty → null');
if (parseMoneyInput('1') !== 1) throw new Error('1');
if (parseMoneyInput('10.5') !== 10.5) throw new Error('10.5');
if (parseMoneyInput('1,284.87') !== 1284.87) throw new Error('comma parse');
if (parseMoneyInput('10.555') !== null) throw new Error('3dp invalid');
if (parseMoneyInput('abc') !== null) throw new Error('abc invalid');
if (parseMoneyInput('900.00') !== 900) throw new Error('900.00 scale');

// Totals semantics (base + addons)
function termsTotal(base, addons) {
  return roundMoneyAmount(base + addons.reduce((s, a) => s + a, 0));
}
if (termsTotal(500, [500]) !== 1000) throw new Error('total 500+500');
if (termsTotal(500, [200, 300]) !== 1000) throw new Error('total 500+200+300');
if (termsTotal(800, [500]) !== 1300) throw new Error('nego total');

console.log('verify-money-parse: ok');
