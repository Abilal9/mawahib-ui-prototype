/** Shared Profile cover layout — edit crop must match this frame. */
export const PROFILE_COVER_HEIGHT = 148;

/** Cover crop aspect width:height (approx phone width / cover height). */
export const PROFILE_COVER_ASPECT: [number, number] = [3, 1];

/** Canonical default Profile.title when none is set. */
export const DEFAULT_PROFILE_TITLE = 'Creative Professional';

/**
 * Display title for profile/user headlines.
 * Real trimmed title wins; otherwise canonical default.
 */
export function displayProfileTitle(
  title: string | null | undefined,
): string {
  const trimmed = title?.trim();
  return trimmed ? trimmed : DEFAULT_PROFILE_TITLE;
}
