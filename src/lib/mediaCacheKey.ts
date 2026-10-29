/**
 * Stable expo-image identity for a Supabase storage object.
 * The signed query string is ignored so a refreshed signature is the same image.
 */
export function getMediaCacheKey(
  uri: string | null | undefined,
): string | undefined {
  if (!uri) return undefined;
  const value = uri.trim();
  if (!value.startsWith('http://') && !value.startsWith('https://')) {
    return undefined;
  }
  try {
    const url = new URL(value);
    const markers = [
      '/object/public/',
      '/object/sign/',
      '/object/authenticated/',
    ];
    for (const marker of markers) {
      const index = url.pathname.indexOf(marker);
      if (index < 0) continue;
      const identity = decodeURIComponent(
        url.pathname.slice(index + marker.length),
      ).replace(/^\/+/, '');
      if (!identity.includes('/')) return undefined;
      return identity;
    }
  } catch {
    return undefined;
  }
  return undefined;
}
