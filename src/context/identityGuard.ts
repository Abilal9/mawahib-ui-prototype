/**
 * A private read or mutation started for one Mawahib user must not write
 * that result after logout or after a different user becomes current.
 * Saved uses the same rule inline. Profile and Notifications share this check.
 */
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
