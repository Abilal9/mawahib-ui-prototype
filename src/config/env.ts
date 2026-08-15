/**
 * Public Expo env — never put secret/service-role keys here.
 *
 * Canonical Nest API base URL (includes `/api/v1`, no trailing slash):
 *   EXPO_PUBLIC_API_URL
 *
 * Defaults to local Nest. Switch via `.env.development` / `.env.production`
 * or `npm run start:local` / `npm run start:railway` — see docs/API_ENV.md.
 */
const DEFAULT_API_BASE_URL = 'http://localhost:3000/api/v1';

function normalizeApiBaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, '');
  return trimmed.length > 0 ? trimmed : DEFAULT_API_BASE_URL;
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabasePublishableKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';
const apiBaseUrl = normalizeApiBaseUrl(
  process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_BASE_URL,
);
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
