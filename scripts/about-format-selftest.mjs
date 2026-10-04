/**
 * About format / identity helpers selftest (no network).
 * Run: node scripts/about-format-selftest.mjs
 */
import assert from 'node:assert/strict';

function displayLanguageLevel(level) {
  const LABELS = {
    A1: 'A1 — Beginner',
    A2: 'A2 — Elementary',
    B1: 'B1 — Intermediate',
    B2: 'B2 — Upper Intermediate',
    C1: 'C1 — Advanced',
    C2: 'C2 — Proficient',
    NATIVE: 'Native / Bilingual',
  };
  if (!level?.trim()) return '';
  const trimmed = level.trim();
  if (LABELS[trimmed]) return LABELS[trimmed];
  if (/^native/i.test(trimmed)) return LABELS.NATIVE;
  const cefr = trimmed.match(/\b(A1|A2|B1|B2|C1|C2)\b/i);
  if (cefr) return LABELS[cefr[1].toUpperCase()];
  return trimmed;
}

function formatMonthYear(month, year) {
  const SHORT = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (!year) return '';
  if (month >= 1 && month <= 12) return `${SHORT[month]} ${year}`;
  return String(year);
}

function formatDateRange({ startMonth, startYear, endMonth, endYear, current, legacyYears }) {
  const start = formatMonthYear(startMonth, startYear);
  if (current) return start ? `${start} – Present` : 'Present';
  const end = formatMonthYear(endMonth, endYear);
  if (start && end) return `${start} – ${end}`;
  if (start) return start;
  if (end) return end;
  return legacyYears?.trim() || '';
}

function normalizeTalentList(raw) {
  const seen = new Set();
  const out = [];
  for (const item of raw) {
    const trimmed = String(item).trim();
    if (!trimmed || trimmed.length > 60) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out.slice(0, 40);
}

function replaceById(list, id, next) {
  return list.map((item) => (item.id === id ? next : item));
}

function removeById(list, id) {
  return list.filter((item) => item.id !== id);
}

assert.equal(displayLanguageLevel('C2'), 'C2 — Proficient');
assert.equal(displayLanguageLevel('NATIVE'), 'Native / Bilingual');
assert.equal(displayLanguageLevel('Native'), 'Native / Bilingual');
assert.equal(displayLanguageLevel('C1 Advanced'), 'C1 — Advanced');
assert.equal(displayLanguageLevel('Business fluent'), 'Business fluent');

assert.equal(
  formatDateRange({ startMonth: 9, startYear: 2018, endMonth: 1, endYear: 2023 }),
  'Sep 2018 – Jan 2023',
);
assert.equal(
  formatDateRange({ startMonth: 8, startYear: 2023, current: true }),
  'Aug 2023 – Present',
);
assert.equal(
  formatDateRange({ legacyYears: '2017 – 2021' }),
  '2017 – 2021',
);

assert.deepEqual(normalizeTalentList([' Photography ', 'photography', 'DJ', '']), [
  'Photography',
  'DJ',
]);

const list = [
  { id: 'a', name: 'A' },
  { id: 'b', name: 'B' },
];
assert.deepEqual(replaceById(list, 'b', { id: 'b', name: 'BB' }), [
  { id: 'a', name: 'A' },
  { id: 'b', name: 'BB' },
]);
assert.deepEqual(removeById(list, 'a'), [{ id: 'b', name: 'B' }]);

console.log('about-format-selftest: OK');
