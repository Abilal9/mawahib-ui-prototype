/** Minimal navigate surface — works with stack + tab composite navigators. */
type ProfileNavigate = {
  navigate(name: 'Profile'): void;
  navigate(name: 'UserProfile', params: { userId: string }): void;
};

/** Open own Profile when `userId` is the signed-in user; otherwise visitor UserProfile. */
export function openUserProfile(
  navigation: ProfileNavigate,
  userId: string,
  meId: string
) {
  if (userId === meId) {
    navigation.navigate('Profile');
    return;
  }
  navigation.navigate('UserProfile', { userId });
}
