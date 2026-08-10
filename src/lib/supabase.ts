import 'react-native-url-polyfill/auto';
import 'expo-sqlite/localStorage/install';
import { createClient } from '@supabase/supabase-js';
import { appEnv } from '../config/env';

/**
 * Supabase Auth client for React Native / Expo.
 * Session persistence uses expo-sqlite's localStorage polyfill (Expo-recommended),
 * which avoids the AsyncStorage "Native module is null" failure in Expo Go / SDK 57.
 */
if (!appEnv.isConfigured) {
  console.warn(
    '[Mawahib] Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  );
}

export const supabase = createClient(
  appEnv.supabaseUrl || 'https://placeholder.supabase.co',
  appEnv.supabasePublishableKey || 'placeholder',
  {
    auth: {
      storage: localStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);
