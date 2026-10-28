import * as Linking from 'expo-linking';
import { supabase } from './supabase';
import { mapDeepLinkAuthError } from './authErrors';
import { loadPendingSignup } from './pendingSignup';

export type AuthDeepLinkResult =
  | { type: 'session'; accessToken: string }
  | { type: 'error'; message: string }
  | { type: 'recovery-rejected' }
  | { type: 'link-rejected' }
  | { type: 'ignored' };

/** Same query-and-hash parse expo-auth-session used before SDK 58 hid it. */
function getQueryParams(input: string): {
  errorCode: string | null;
  params: Record<string, string>;
} {
  const url = new URL(input, 'https://phony.example');
  const errorCode = url.searchParams.get('errorCode');
  url.searchParams.delete('errorCode');
  const params = Object.fromEntries(url.searchParams);
  if (url.hash) {
    new URLSearchParams(url.hash.replace(/^#/, '')).forEach((value, key) => {
      params[key] = value;
    });
  }
  return { errorCode, params };
}

function callbackType(url: string): string | null {
  const { params } = getQueryParams(url);
  const type = params.type;
  return typeof type === 'string' ? type : null;
}

function decodeBase64Url(segment: string): string {
  const alphabet =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const padded = segment
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(segment.length / 4) * 4, '=');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of padded) {
    if (char === '=') break;
    const index = alphabet.indexOf(char);
    if (index < 0) throw new Error('bad base64');
    value = (value << 6) | index;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((value >> bits) & 0xff);
    }
  }
  return decodeURIComponent(
    bytes.map((byte) => `%${byte.toString(16).padStart(2, '0')}`).join(''),
  );
}

function accessTokenClaims(accessToken: string): {
  email: string | null;
  methods: string[];
} | null {
  try {
    const part = accessToken.split('.')[1];
    if (!part) return null;
    const parsed = JSON.parse(decodeBase64Url(part)) as {
      email?: unknown;
      amr?: { method?: unknown }[];
    };
    const email =
      typeof parsed.email === 'string'
        ? parsed.email.trim().toLowerCase()
        : null;
    const methods = Array.isArray(parsed.amr)
      ? parsed.amr
          .map((entry) =>
            typeof entry?.method === 'string' ? entry.method.toLowerCase() : '',
          )
          .filter(Boolean)
      : [];
    return { email, methods };
  } catch {
    return null;
  }
}

const SIGNUP_LINK_TYPES = new Set(['signup', 'email', 'invite', 'magiclink']);

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

  // Exact recovery type is rejected before any session is created.
  // Implicit setSession would emit SIGNED_IN and drop type=recovery.
  if (callbackType(url) === 'recovery') {
    return { type: 'recovery-rejected' };
  }

  const { params, errorCode } = getQueryParams(url);
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
    // PKCE codes are exchanged only for an explicit non-recovery signup type.
    // A recovery code must not become a session by omitting or relabeling type.
    const linkType = callbackType(url);
    if (params.code && linkType && SIGNUP_LINK_TYPES.has(linkType)) {
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

  // URL type is not authenticated. Recovery tokens stay rejected even if the
  // link says type=signup. Other token links must match this device's pending signup.
  const claims = accessTokenClaims(access_token);
  if (!claims || claims.methods.includes('recovery')) {
    return { type: 'recovery-rejected' };
  }
  const pendingEmail = loadPendingSignup()?.email?.trim().toLowerCase() ?? '';
  const linkType = callbackType(url);
  if (
    !linkType ||
    !SIGNUP_LINK_TYPES.has(linkType) ||
    !pendingEmail ||
    !claims.email ||
    claims.email !== pendingEmail
  ) {
    return { type: 'link-rejected' };
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
