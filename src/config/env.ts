/**
 * Public Expo env — never put secret/service-role keys here.
 */
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';
const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';
const phoneAuthEnabled =
  (process.env.EXPO_PUBLIC_PHONE_AUTH_ENABLED ?? 'false').toLowerCase() ===
  'true';

export const appEnv = {
  supabaseUrl,
  supabasePublishableKey,
  apiBaseUrl,
  /** Flip to true after Supabase Phone Auth + SMS provider are configured. */
  phoneAuthEnabled,
  isConfigured: Boolean(supabaseUrl && supabasePublishableKey),
};
