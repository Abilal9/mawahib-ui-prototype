/**
 * A private read or mutation started for one Mawahib user must not write
 * that result after logout or after a different user becomes current.
 * Saved uses the same rule inline. Profile and Notifications share this check.
 *
 * Future Guest work may pass `guest:<epoch>` as the identity id. A null start
 * id is still stale. Phase A does not fetch as Guest.
 */
export function authenticatedIdentityId(userId: string): string {
  return `user:${userId}`;
}

export function guestIdentityId(epoch: number): string {
  return `guest:${epoch}`;
}

export function shouldIgnoreStaleIdentityResult(input: {
  startedUserId: string | null;
  currentUserId: string | null;
  epochAtStart: number;
  epochNow: number;
}): boolean {
  if (!input.startedUserId) return true;
  if (input.startedUserId !== input.currentUserId) return true;
  if (input.epochAtStart !== input.epochNow) return true;
  return false;
}
