/**
 * Expo app config — evaluated in Node when Expo CLI starts.
 *
 * Nest API base URL is resolved HERE (not in the Metro client dotenv merge),
 * so `npm run start:local` / `start:railway` shell values always win over
 * `.env` / `.env.development`. See docs/API_ENV.md.
 */
const appJson = require('./app.json');

const LOCAL_API_BASE_URL = 'http://localhost:3000/api/v1';
const RAILWAY_API_BASE_URL =
  'https://mawahib-backend-production.up.railway.app/api/v1';

function normalizeApiBaseUrl(raw) {
  if (typeof raw !== 'string') {
    return LOCAL_API_BASE_URL;
  }
  const trimmed = raw.trim().replace(/\/+$/, '');
  return trimmed.length > 0 ? trimmed : LOCAL_API_BASE_URL;
}

function resolveApiBaseUrl() {
  // 1) Explicit EXPO_PUBLIC_API_URL from npm scripts / CI / shell
  //    (@expo/env does not overwrite keys already set in process.env)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return normalizeApiBaseUrl(process.env.EXPO_PUBLIC_API_URL);
  }

  // 2) Optional target hint (used by npm scripts as a clear switch)
  const target = (process.env.MAWAHIB_API_TARGET || '').toLowerCase();
  if (target === 'railway') {
    return RAILWAY_API_BASE_URL;
  }
  if (target === 'local') {
    return LOCAL_API_BASE_URL;
  }

  // 3) Default: local Nest (safe for `expo start` without a script)
  return LOCAL_API_BASE_URL;
}

const apiBaseUrl = resolveApiBaseUrl();

/** @type {import('expo/config').ExpoConfig} */
const expoConfig = {
  ...appJson.expo,
  extra: {
    ...(appJson.expo.extra || {}),
    /** Canonical Nest API root including `/api/v1` (no trailing slash). */
    apiBaseUrl,
  },
};

module.exports = { expo: expoConfig };
