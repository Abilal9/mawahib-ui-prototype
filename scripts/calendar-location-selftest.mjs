/**
 * Calendar-day and Google Maps link rules used by commercial request flows.
 * Dates come from the runtime clock. Nothing here is pinned to a calendar year.
 */
import fs from 'node:fs';
import path from 'node:path';

function startOfLocalDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfLocalMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function isPastLocalDay(day, now) {
  return startOfLocalDay(day).getTime() < startOfLocalDay(now).getTime();
}

function isCurrentLocalMonth(month, now) {
  return (
    month.getFullYear() === now.getFullYear() &&
    month.getMonth() === now.getMonth()
  );
}

function isBeforeCurrentMonth(month, now) {
  return startOfLocalMonth(month).getTime() < startOfLocalMonth(now).getTime();
}

function isCalendarDayBlocked(day, now, notBefore) {
  if (isPastLocalDay(day, now)) return true;
  if (!notBefore) return false;
  return startOfLocalDay(day).getTime() < startOfLocalDay(notBefore).getTime();
}

function isHttpUrl(value) {
  return /^https?:\/\//i.test(value.trim());
}

function buildGoogleMapsSearchUrl(input) {
  if (input == null) return null;
  if (typeof input === 'string') return urlForQuery(input);
  if (
    typeof input.latitude === 'number' &&
    Number.isFinite(input.latitude) &&
    typeof input.longitude === 'number' &&
    Number.isFinite(input.longitude)
  ) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${input.latitude},${input.longitude}`)}`;
  }
  return urlForQuery(input.query);
}

function urlForQuery(value) {
  const text = value?.trim() ?? '';
  if (!text || isHttpUrl(text)) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(text)}`;
}

function assert(condition, message) {
  if (!condition) {
    console.error('FAIL', message);
    process.exitCode = 1;
  }
}

const now = new Date();
const today = startOfLocalDay(now);
const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
const visible = startOfLocalMonth(now);

assert(
  visible.getFullYear() === now.getFullYear() && visible.getMonth() === now.getMonth(),
  'new calendar month is the runtime month',
);
if (!isCurrentLocalMonth(new Date(2025, 5, 1), now)) {
  assert(
    !(visible.getFullYear() === 2025 && visible.getMonth() === 5),
    'initial month is not hard-coded June 2025',
  );
}
assert(isPastLocalDay(yesterday, now), 'yesterday is past');
assert(!isPastLocalDay(today, now), 'today is not past');
assert(!isPastLocalDay(tomorrow, now), 'tomorrow is not past');
assert(isCalendarDayBlocked(yesterday, now), 'yesterday cell is blocked');
assert(!isCalendarDayBlocked(today, now), 'today cell is enabled');
assert(!isCalendarDayBlocked(tomorrow, now), 'tomorrow cell is enabled');
assert(isCurrentLocalMonth(visible, now), 'current month has no previous month');
assert(
  isBeforeCurrentMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1), now),
  'the month before today is historical',
);

const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
assert(!isCurrentLocalMonth(nextMonth, now), 'next month can go back');
assert(
  !isBeforeCurrentMonth(startOfLocalMonth(now), now),
  'returning from next month stops at the current month',
);

assert(
  isCalendarDayBlocked(today, now, tomorrow),
  'range end before the start is blocked when start is tomorrow',
);
assert(
  !isCalendarDayBlocked(tomorrow, now, tomorrow),
  'range end on the start day is allowed',
);
const later = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate() + 3);
assert(!isCalendarDayBlocked(later, now, tomorrow), 'a later range end is allowed');

const road = buildGoogleMapsSearchUrl('King Fahd Road, Riyadh');
assert(road?.startsWith('https://www.google.com/maps/search/?api=1&query='), 'maps search url');
assert(road?.includes(encodeURIComponent('King Fahd Road, Riyadh')), 'place is encoded');
assert(!road?.includes('King Fahd Road, Riyadh'), 'raw place text is not concatenated');

const special = buildGoogleMapsSearchUrl('Al Olaya, Riyadh & Nearby');
assert(special?.includes(encodeURIComponent('Al Olaya, Riyadh & Nearby')), 'ampersand is encoded');
assert(!special?.includes('& Nearby'), 'raw ampersand is not left in the query');

assert(buildGoogleMapsSearchUrl(null) === null, 'null has no link');
assert(buildGoogleMapsSearchUrl(undefined) === null, 'undefined has no link');
assert(buildGoogleMapsSearchUrl('') === null, 'empty has no link');
assert(buildGoogleMapsSearchUrl('   ') === null, 'blank has no link');
assert(buildGoogleMapsSearchUrl('https://evil.example/phish') === null, 'raw url is not opened');

const coords = buildGoogleMapsSearchUrl({ latitude: 24.7136, longitude: 46.6753 });
assert(coords?.includes(encodeURIComponent('24.7136,46.6753')), 'coordinates are encoded');

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const serviceCalendar = fs.readFileSync(
  path.join(root, 'src/screens/profile/RequestServiceScreen.tsx'),
  'utf8',
);
assert(!serviceCalendar.includes('new Date(2025, 5, 1)'), 'service calendar is not pinned to June 2025');
assert(serviceCalendar.includes('startOfLocalMonth(new Date())'), 'service calendar opens on the current month');
assert(serviceCalendar.includes('disabled={blocked}'), 'service past cells are disabled');
assert(
  serviceCalendar.includes('onPress={blocked ? undefined : () => onPickCalendarDay(day)}'),
  'blocked service cells have no selection handler',
);

const picker = fs.readFileSync(path.join(root, 'src/components/ui/CalendarPicker.tsx'), 'utf8');
assert(picker.includes('disabled={blocked}'), 'shared picker disables blocked cells');
assert(
  picker.includes('onPress={blocked ? undefined : () => onPickDay(date)}'),
  'shared picker does not select a blocked cell',
);
assert(picker.includes('disabled={atCurrentMonth}'), 'shared picker disables previous month');

if (process.exitCode) process.exit(process.exitCode);
console.log('calendar-location-selftest ok');
