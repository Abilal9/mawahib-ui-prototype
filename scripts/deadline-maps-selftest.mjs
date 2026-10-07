/**
 * Deadline modes do not share fields, and a saved Google Maps URL is opened
 * exactly when it is an official HTTPS Maps link.
 */

function clearedDeadline(mode) {
  return {
    mode,
    exactDate: null,
    rangeFrom: null,
    rangeTo: null,
    durationValue: '',
    durationUnit: 'days',
    monthReset: true,
  };
}

function activePayload(state) {
  if (state.mode === 'exact_date' || state.mode === 'deadline') {
    return state.exactDate
      ? { type: 'exact_date', startDate: state.exactDate }
      : null;
  }
  if (state.mode === 'date_range' || state.mode === 'duration-range') {
    return state.rangeFrom && state.rangeTo
      ? { type: 'date_range', startDate: state.rangeFrom, endDate: state.rangeTo }
      : null;
  }
  if (state.mode === 'duration') {
    const value = Number(state.durationValue);
    return Number.isInteger(value) && value >= 1
      ? { type: 'duration', durationValue: value, durationUnit: state.durationUnit }
      : null;
  }
  return { type: 'flexible' };
}

function reviewLine(state) {
  const payload = activePayload(state);
  if (!payload) return '';
  if (payload.type === 'exact_date') return payload.startDate;
  if (payload.type === 'date_range') return `${payload.startDate} – ${payload.endDate}`;
  if (payload.type === 'duration') return `${payload.durationValue} ${payload.durationUnit}`;
  return 'Flexible';
}

const MAPS_PATH = /^\/maps(\/|$)/;

function acceptedGoogleMapsUrl(value) {
  const text = value?.trim() ?? '';
  if (!text || text.length > 2000) return null;
  let url;
  try {
    url = new URL(text);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:') return null;
  if (url.username || url.password) return null;
  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  const googleHost =
    host === 'google.com' ||
    host === 'www.google.com' ||
    /^www\.google\.(?:com|[a-z]{2}|com\.[a-z]{2}|co\.[a-z]{2})$/.test(host);
  const mapsHost = /^maps\.google\.(?:com|[a-z]{2}|com\.[a-z]{2}|co\.[a-z]{2})$/.test(host);
  if (host === 'maps.app.goo.gl' && url.pathname.length > 1) return text;
  if (mapsHost) return text;
  if (googleHost && MAPS_PATH.test(url.pathname)) return text;
  return null;
}

function resolveMapsDestination({ mapsUrl, query }) {
  const explicit = acceptedGoogleMapsUrl(mapsUrl);
  if (explicit) return explicit;
  const place = query?.trim() ?? '';
  if (!place || /^https?:\/\//i.test(place)) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`;
}

function assert(condition, message) {
  if (!condition) {
    console.error('FAIL', message);
    process.exitCode = 1;
  }
}

const afterExact = clearedDeadline('exact_date');
assert(afterExact.durationValue === '', 'duration value is inactive on exact date');
assert(afterExact.rangeFrom === null && afterExact.rangeTo === null, 'range is inactive on exact date');
assert(reviewLine(afterExact) === '', 'empty exact date is not a duration summary');
assert(activePayload(afterExact) === null, 'empty exact date sends no duration');

const exactOnly = {
  ...clearedDeadline('exact_date'),
  exactDate: '2026-10-20',
};
assert(reviewLine(exactOnly) === '2026-10-20', 'review shows only the exact date');
assert(!JSON.stringify(activePayload(exactOnly)).includes('duration'), 'exact payload has no duration');

const durationOnly = {
  ...clearedDeadline('duration'),
  durationValue: '7',
  durationUnit: 'days',
};
assert(reviewLine(durationOnly) === '7 days', 'review shows only the duration');
assert(activePayload(durationOnly).type === 'duration', 'payload is duration');
assert(durationOnly.exactDate === null, 'exact date is inactive during duration');

const flexible = clearedDeadline('flexible');
assert(activePayload(flexible).type === 'flexible', 'flexible payload has no dates');
assert(!activePayload(flexible).startDate, 'flexible does not submit a start date');

const rangeOnly = {
  ...clearedDeadline('date_range'),
  rangeFrom: '2026-10-20',
  rangeTo: '2026-10-25',
};
assert(reviewLine(rangeOnly) === '2026-10-20 – 2026-10-25', 'review shows only the range');
assert(activePayload(rangeOnly).type === 'date_range', 'payload is the range');

const returned = clearedDeadline('exact_date');
assert(returned.exactDate === null && returned.monthReset, 'returning to exact date starts clean');

const short = 'https://maps.app.goo.gl/PtLByLhcorAFhiaa8';
assert(acceptedGoogleMapsUrl(short) === short, 'short link is preserved exactly');
assert(resolveMapsDestination({ mapsUrl: short, query: 'Riyadh, KSA · Villa 3' }) === short, 'place text does not replace the maps url');

const long = 'https://www.google.com/maps/place/Riyadh/@24.7,46.6,12z';
assert(acceptedGoogleMapsUrl(long) === long, 'long maps link is preserved');
assert(acceptedGoogleMapsUrl('https://maps.google.com/?q=Riyadh') === 'https://maps.google.com/?q=Riyadh', 'maps.google.com is accepted');

assert(
  resolveMapsDestination({ query: 'King Fahd Road, Riyadh' }) ===
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('King Fahd Road, Riyadh')}`,
  'place text falls back to a search url',
);
assert(resolveMapsDestination({}) === null, 'nothing meaningful has no maps action');
assert(acceptedGoogleMapsUrl('https://example.com/test') === null, 'example.com is rejected');
assert(acceptedGoogleMapsUrl('javascript:alert(1)') === null, 'javascript scheme is rejected');
assert(acceptedGoogleMapsUrl('file:///tmp/x') === null, 'file scheme is rejected');
assert(acceptedGoogleMapsUrl('data:text/html,hi') === null, 'data scheme is rejected');

if (process.exitCode) process.exit(process.exitCode);
console.log('deadline-maps-selftest ok');
