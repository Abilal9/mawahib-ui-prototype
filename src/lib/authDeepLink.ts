import * as Linking from 'expo-linking';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { supabase } from './supabase';
import { mapDeepLinkAuthError } from './authErrors';

export type AuthDeepLinkResult =
  | { type: 'session'; accessToken: string }
  | { type: 'error'; message: string }
  | { type: 'ignored' };

/**
 * Handle Supabase auth redirects opened via deep link / universal link.
 * Supports success tokens and error query params (e.g. otp_expired).
 */
export async function handleAuthDeepLink(url: string): Promise<AuthDeepLinkResult> {
  if (!url) return { type: 'ignored' };

  // Only handle our auth callback (or Supabase verify redirects into the app).
  const parsed = Linking.parse(url);
  const path = (parsed.path ?? '').replace(/^\//, '');
  const looksLikeAuthCallback =
    path.includes('auth/callback') ||
    url.includes('access_token') ||
    url.includes('refresh_token') ||
    url.includes('error=') ||
    url.includes('error_code=') ||
    url.includes('type=signup') ||
    url.includes('type=recovery');

  if (!looksLikeAuthCallback) {
    return { type: 'ignored' };
  }

  const { params, errorCode } = QueryParams.getQueryParams(url);
  const errorMessage = mapDeepLinkAuthError({
    ...params,
    error_code: errorCode || params.error_code,
  });
  if (errorMessage) {
    return { type: 'error', message: errorMessage };
  }

  const access_token = params.access_token;
  const refresh_token = params.refresh_token;
  if (!access_token || !refresh_token) {
    // PKCE code flow
    if (params.code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(params.code);
      if (error) {
        return { type: 'error', message: mapDeepLinkAuthError({ error: error.message }) || error.message };
      }
      if (data.session?.access_token) {
        return { type: 'session', accessToken: data.session.access_token };
      }
    }
    return { type: 'ignored' };
  }

  const { data, error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });
  if (error) {
    return {
      type: 'error',
      message: mapDeepLinkAuthError({ error: error.message }) || error.message,
    };
  }
  if (!data.session?.access_token) {
    return { type: 'ignored' };
  }
  return { type: 'session', accessToken: data.session.access_token };
}
