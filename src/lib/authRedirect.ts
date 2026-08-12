import * as Linking from 'expo-linking';

/**
 * Canonical auth redirect for email confirmation / recovery links.
 * Must be allow-listed in Supabase Auth → URL Configuration → Redirect URLs.
 */
export const AUTH_CALLBACK_PATH = 'auth/callback';

export function getAuthRedirectUrl(): string {
  return Linking.createURL(AUTH_CALLBACK_PATH);
}

/** Custom scheme registered in app.json — used in dashboard allow-list examples. */
export const APP_SCHEME = 'mawahib';
