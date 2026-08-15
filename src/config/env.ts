import Constants from 'expo-constants';

/**
 * Public Expo env — never put secret/service-role keys here.
 *
 * Nest API base URL (single source of truth for HTTP clients):
 *   1. `expo.extra.apiBaseUrl` from `app.config.js` (preferred — set by
 *      `npm run start:local` / `start:railway` via EXPO_PUBLIC_API_URL)
 *   2. Fallback default: local Nest
 *
 * Do not put EXPO_PUBLIC_API_URL in `.env` / `.env.development` for switching;
 * Expo's client dotenv merge would override the npm script. See docs/API_ENV.md.
 */
const DEFAULT_API_BASE_URL = 'http://localhost:3000/api/v1';

function normalizeApiBaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, '');
  return trimmed.length > 0 ? trimmed : DEFAULT_API_BASE_URL;
}

function resolveApiBaseUrl(): string {
  const fromExtra = Constants.expoConfig?.extra?.apiBaseUrl;
  if (typeof fromExtra === 'string' && fromExtra.trim().length > 0) {
    return normalizeApiBaseUrl(fromExtra);
  }
  return DEFAULT_API_BASE_URL;
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabasePublishableKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';
const apiBaseUrl = resolveApiBaseUrl();
const phoneAuthEnabled =
  (process.env.EXPO_PUBLIC_PHONE_AUTH_ENABLED ?? 'false').toLowerCase() ===
  'true';

export const appEnv = {
  supabaseUrl,
  supabasePublishableKey,
  /** Nest API root including `/api/v1` — sole source for HTTP clients. */
  apiBaseUrl,
  /** Flip to true after Supabase Phone Auth + SMS provider are configured. */
  phoneAuthEnabled,
  isConfigured: Boolean(supabaseUrl && supabasePublishableKey),
};
