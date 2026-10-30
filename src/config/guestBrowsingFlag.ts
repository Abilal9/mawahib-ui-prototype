/**
 * Temporary Guest Browsing implementation flag.
 * Remove in Phase I. Not a remote/persistent feature-flag system.
 *
 * Unset / "false" → false (production default).
 * "true" → true (local structural testing only).
 */
export function parseGuestBrowsingFlag(
  raw: string | undefined | null,
): boolean {
  return String(raw ?? 'false').trim().toLowerCase() === 'true';
}

export function isGuestBrowsingEnabled(): boolean {
  return parseGuestBrowsingFlag(process.env.EXPO_PUBLIC_GUEST_BROWSING);
}
