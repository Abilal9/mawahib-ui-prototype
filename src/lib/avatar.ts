/**
 * Canonical user avatar presentation rules.
 * DB/API: avatarUrl = null means “use application default” — never store a default file per user.
 */

export const MAWAHIB_DEFAULT_AVATAR_BG = '#F6339A';

/** True when a real custom avatar asset/URL should be shown. */
export function hasCustomAvatar(
  uri: string | number | null | undefined,
): boolean {
  if (typeof uri === 'number') return true;
  if (typeof uri !== 'string') return false;
  const trimmed = uri.trim();
  return trimmed.length > 0;
}

/** Icon size ~45% of avatar diameter, clamped for readability. */
export function defaultAvatarIconSize(avatarSize: number): number {
  if (!Number.isFinite(avatarSize) || avatarSize <= 0) return 20;
  return Math.max(14, Math.min(48, Math.round(avatarSize * 0.45)));
}
