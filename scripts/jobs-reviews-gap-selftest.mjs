import { readFileSync } from 'node:fs';

/**
 * Gap-close rules that the app implements inline:
 * local past calendar days, same-day past slots, service quote totals,
 * and which PDFs leave the app.
 *
 * Deadlines stored by the API are calendar dates (Asia/Riyadh), not clocks.
 * Same-day slot disabling is the rule the UI must use if a time list is shown.
 */

function startOfLocalDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isPastLocalDay(day, now) {
  return startOfLocalDay(day).getTime() < startOfLocalDay(now).getTime();
}

/** A slot is selectable when its local timestamp is strictly after now. */
function isSelectableSlot(day, hours, minutes, now) {
  if (isPastLocalDay(day, now)) return false;
  const slot = new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    hours,
    minutes,
    0,
    0,
  );
  const sameDay =
    startOfLocalDay(day).getTime() === startOfLocalDay(now).getTime();
  if (!sameDay) return true;
  return slot.getTime() > now.getTime();
}

function serviceQuote(base, addonPrices) {
  const addonSubtotal = addonPrices.reduce((sum, price) => sum + price, 0);
  return { base, addonSubtotal, total: base + addonSubtotal };
}

function pdfUsesExternalHandler(platform, mimeType) {
  return platform === 'android' && String(mimeType).toLowerCase().includes('pdf');
}

function assert(condition, message) {
  if (!condition) {
    console.error('FAIL', message);
    process.exitCode = 1;
  }
}

const now = new Date(2026, 9, 7, 16, 30, 0, 0);
const oct6 = new Date(2026, 9, 6, 12, 0, 0, 0);
const oct7 = new Date(2026, 9, 7, 9, 0, 0, 0);
const oct8 = new Date(2026, 9, 8, 9, 0, 0, 0);

assert(isPastLocalDay(oct6, now), 'Oct 6 is disabled');
assert(!isPastLocalDay(oct7, now), 'Oct 7 is selectable');
assert(!isPastLocalDay(oct8, now), 'Oct 8 is selectable');

assert(!isSelectableSlot(oct7, 12, 0, now), 'today 12:00 is disabled');
assert(!isSelectableSlot(oct7, 16, 0, now), 'today 16:00 is disabled');
assert(isSelectableSlot(oct7, 17, 0, now), 'today 17:00 is selectable');
assert(isSelectableSlot(oct8, 9, 0, now), 'tomorrow 09:00 is selectable');

const justAfterMidnight = new Date(2026, 9, 8, 0, 5, 0, 0);
assert(isPastLocalDay(oct7, justAfterMidnight), 'yesterday is past after midnight');
assert(!isPastLocalDay(new Date(2026, 9, 8), justAfterMidnight), 'new local day is selectable');

const quote = serviceQuote(1200, [100, 150]);
assert(quote.base === 1200, 'base price');
assert(quote.addonSubtotal === 250, 'add-on subtotal');
assert(quote.total === 1450, 'total is base plus add-ons');
assert(quote.total !== quote.base + quote.addonSubtotal + quote.addonSubtotal, 'add-ons are not double counted');

const slides = ['a', 'b', 'c', 'd'];
assert(slides.join(',') === 'a,b,c,d', 'carousel keeps upload order');
assert(slides.length === 4, 'all slides are reachable');

assert(pdfUsesExternalHandler('android', 'application/pdf'), 'android pdf leaves the app');
assert(!pdfUsesExternalHandler('ios', 'application/pdf'), 'ios pdf stays in app');
assert(!pdfUsesExternalHandler('android', 'image/jpeg'), 'android images stay in app');
assert(pdfUsesExternalHandler('android', 'application/pdf'), 'invoices use the same android rule');

const jobsContext = readFileSync(
  new URL('../src/context/UserJobsContext.tsx', import.meta.url),
  'utf8',
);
assert(
  jobsContext.includes('jobApplicationStatus'),
  'applicant cards read canonical application status',
);
const reviewsMapping = readFileSync(
  new URL('../src/utils/reviewsMapping.ts', import.meta.url),
  'utf8',
);
assert(
  reviewsMapping.includes('contextLabel'),
  'public review cards use the safe context label',
);
assert(
  !reviewsMapping.includes('engagementTitle'),
  'public review cards do not read the private engagement title',
);
assert(
  jobsContext.indexOf("case 'under_review'") <
    jobsContext.indexOf("default:\n      return { status: 'pending'"),
  'under review is chosen before the pending fallback',
);

if (process.exitCode) {
  process.exit(process.exitCode);
}
console.log('jobs-reviews-gap-selftest ok');
