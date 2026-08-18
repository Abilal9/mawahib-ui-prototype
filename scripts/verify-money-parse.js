/**
 * Lightweight regression checks for money label parsing (mirrors src/utils/money.ts).
 * Run: node scripts/verify-money-parse.js
 */
function parseMoneyAmountFromLabel(label) {
  if (typeof label !== 'string') return null;
  const match = label.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const amount = Number(match[0]);
  if (!Number.isFinite(amount)) return null;
  return Math.round(amount * 100) / 100;
}

function moneyAmountDraftFromLabel(label) {
  const amount = parseMoneyAmountFromLabel(label);
  if (amount === null) return '0';
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
}

function formatMoneyDisplay({ amount, currency }) {
  const code = String(currency || 'SAR').toUpperCase();
  const rounded = Math.round(amount * 100) / 100;
  const number = rounded.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const prefix = code === 'AED' ? 'Dhs' : 'SAR';
  return `${prefix} ${number}`;
}

const cases = [
  ['SAR 900.00', 900, '900'],
  ['Dhs 900.00', 900, '900'],
  ['+ 280', 280, '280'],
  ['1,250.50', 1250.5, '1250.50'],
];
for (const [label, amt, draft] of cases) {
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
console.log('verify-money-parse: ok');
