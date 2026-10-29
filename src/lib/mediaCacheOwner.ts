/**
 * Clear the on-device image cache when leaving an authenticated user.
 * The first observation in a process does not clear, so a cold start as the
 * same user can keep its cache. Logout and account switch do clear.
 * expo-image only offers a global clear, so public images are cleared too.
 */
export function shouldClearMediaImageCache(
  previousUserId: string | null | undefined,
  nextUserId: string | null,
): boolean {
  if (previousUserId == null || previousUserId === '') return false;
  return previousUserId !== nextUserId;
}
