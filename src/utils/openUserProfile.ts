import { isBackendUserId } from '../lib/isBackendUserId';

/** Minimal navigate surface — works with stack + tab composite navigators. */
type ProfileNavigate = {
  navigate(name: 'Profile'): void;
  navigate(name: 'UserProfile', params: { userId: string }): void;
};

/**
 * Open own Profile when `userId` is the signed-in user; otherwise visitor UserProfile.
 * Only navigates to visitor profiles with real backend UUIDs — never mock ids (u1, u-omar-q, …).
 */
export function openUserProfile(
  navigation: ProfileNavigate,
  userId: string,
  meId: string,
) {
  if (!userId) return;
  if (userId === meId) {
    navigation.navigate('Profile');
    return;
  }
  if (!isBackendUserId(userId)) {
    return;
  }
  navigation.navigate('UserProfile', { userId });
}
