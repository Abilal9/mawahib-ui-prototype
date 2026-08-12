import React, { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import * as Linking from 'expo-linking';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { handleAuthDeepLink } from '../../lib/authDeepLink';
import { useAuth } from '../../context/AuthContext';
import type { RootStackParamList } from '../../navigation/types';

/**
 * Listens for Supabase auth redirects (email confirmation / recovery).
 * Primary signup UX is email OTP on ConfirmCode; this covers link-based emails
 * and surfaces expired-link errors inside the app instead of Nest's 404 page.
 */
export default function AuthDeepLinkListener() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { refreshMe, bootstrapSession, isSignedIn, apiUser } = useAuth();
  const handling = useRef(false);

  useEffect(() => {
    const run = async (url: string | null) => {
      if (!url || handling.current) return;
      handling.current = true;
      try {
        const result = await handleAuthDeepLink(url);
        if (result.type === 'error') {
          Alert.alert('Verification failed', result.message, [
            {
              text: 'OK',
              onPress: () => navigation.navigate('SignIn'),
            },
          ]);
          return;
        }
        if (result.type === 'session') {
          try {
            if (apiUser) {
              await refreshMe();
            } else {
              await bootstrapSession();
            }
            navigation.reset({
              index: 0,
              routes: [{ name: 'MainTabs' }],
            });
          } catch {
            navigation.navigate('TurnOnNotifications');
          }
        }
      } finally {
        handling.current = false;
      }
    };

    void Linking.getInitialURL().then((url) => run(url));
    const sub = Linking.addEventListener('url', ({ url }) => {
      void run(url);
    });
    return () => sub.remove();
  }, [apiUser, bootstrapSession, isSignedIn, navigation, refreshMe]);

  return null;
}
