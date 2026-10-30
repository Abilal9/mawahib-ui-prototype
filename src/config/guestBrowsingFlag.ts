/**
 * Temporary Guest Browsing implementation flag.
 * Remove in Phase I. Not a remote/persistent feature-flag system.
 *
 * Unset / "true" → true (Phase H signed-out product).
 * "false" → false (rollback to pre-guest signed-out destinations).
 */
export function parseGuestBrowsingFlag(
  raw: string | undefined | null,
): boolean {
  return String(raw ?? 'true').trim().toLowerCase() !== 'false';
}

export function isGuestBrowsingEnabled(): boolean {
  return parseGuestBrowsingFlag(process.env.EXPO_PUBLIC_GUEST_BROWSING);
}
