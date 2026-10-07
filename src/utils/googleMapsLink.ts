const MAPS_SEARCH = 'https://www.google.com/maps/search/?api=1&query=';
const MAPS_PATH = /^\/maps(\/|$)/;

function isGoogleHost(host: string): boolean {
  return (
    host === 'google.com' ||
    host === 'www.google.com' ||
    /^www\.google\.(?:com|[a-z]{2}|com\.[a-z]{2}|co\.[a-z]{2})$/.test(host)
  );
}

function isMapsGoogleHost(host: string): boolean {
  return /^maps\.google\.(?:com|[a-z]{2}|com\.[a-z]{2}|co\.[a-z]{2})$/.test(host);
}

/**
 * Valid HTTPS Google Maps URL, returned exactly as trimmed.
 * Short links are not rewritten into a search URL.
 */
export function acceptedGoogleMapsUrl(
  value: string | null | undefined,
): string | null {
  const text = value?.trim() ?? '';
  if (!text || text.length > 2000) return null;
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:') return null;
  if (url.username || url.password) return null;
  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  const shortLink = host === 'maps.app.goo.gl' && url.pathname.length > 1;
  const mapsHost = isMapsGoogleHost(host);
  const googleMapsPath = isGoogleHost(host) && MAPS_PATH.test(url.pathname);
  if (!shortLink && !mapsHost && !googleMapsPath) return null;
  return text;
}

function isFiniteCoord(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** A stored maps URL is not opened directly. Place text is search-encoded instead. */
function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

/**
 * Google Maps search URL for a place or coordinates.
 * Returns null when there is nothing meaningful to open.
 * Never returns the caller's raw string.
 */
export function buildGoogleMapsSearchUrl(
  input?:
    | string
    | null
    | {
        query?: string | null;
        latitude?: number | null;
        longitude?: number | null;
      },
): string | null {
  if (input == null) return null;
  if (typeof input === 'string') return urlForQuery(input);
  if (isFiniteCoord(input.latitude) && isFiniteCoord(input.longitude)) {
    return `${MAPS_SEARCH}${encodeURIComponent(`${input.latitude},${input.longitude}`)}`;
  }
  return urlForQuery(input.query);
}

/**
 * Click destination. An explicit Maps URL wins. Coordinates and place text
 * are only used when that URL is absent.
 */
export function resolveMapsDestination(input: {
  mapsUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  query?: string | null;
}): string | null {
  const explicit = acceptedGoogleMapsUrl(input.mapsUrl);
  if (explicit) return explicit;
  if (isFiniteCoord(input.latitude) && isFiniteCoord(input.longitude)) {
    return `${MAPS_SEARCH}${encodeURIComponent(`${input.latitude},${input.longitude}`)}`;
  }
  return buildGoogleMapsSearchUrl(input.query);
}

function urlForQuery(value: string | null | undefined): string | null {
  const text = value?.trim() ?? '';
  if (!text || isHttpUrl(text)) return null;
  return `${MAPS_SEARCH}${encodeURIComponent(text)}`;
}

/** Place line written into service-request notes: `Location: King Fahd Road, Riyadh`. */
export function placeFromLocationNote(
  notes: string | null | undefined,
): string | null {
  if (!notes) return null;
  for (const line of notes.split('\n')) {
    const match = /^Location:\s*(.+)$/i.exec(line.trim());
    const place = match?.[1]?.trim() ?? '';
    if (place && !isHttpUrl(place)) return place;
  }
  return null;
}
