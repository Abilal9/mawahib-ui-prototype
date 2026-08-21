import React, { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import * as Linking from 'expo-linking';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { handleAuthDeepLink } from '../../lib/authDeepLink';
import { useAuth } from '../../context/AuthContext';
import { resolvePostAuthDestination } from '../../lib/postAuthGate';
import type { RootStackParamList } from '../../navigation/types';

/**
 * Listens for Supabase auth redirects (legacy confirmation links / recovery / OAuth).
 * Primary signup UX is email OTP on ConfirmCode — deep links must still pass the
 * same post-auth gate and cannot bypass email verification or Nest hydrate.
 *
 * Initial URL is processed once; live `url` events still work. Auth/session
 * dependency updates must not re-run getInitialURL side effects.
 */
export default function AuthDeepLinkListener() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { refreshMe, bootstrapSession, apiUser, session, signUpBasics } =
    useAuth();
  const handling = useRef(false);
  const initialUrlHandled = useRef(false);
  const apiUserRef = useRef(apiUser);
  const sessionRef = useRef(session);
  const signUpBasicsRef = useRef(signUpBasics);
  const refreshMeRef = useRef(refreshMe);
  const bootstrapSessionRef = useRef(bootstrapSession);
  const navigationRef = useRef(navigation);

  apiUserRef.current = apiUser;
  sessionRef.current = session;
  signUpBasicsRef.current = signUpBasics;
  refreshMeRef.current = refreshMe;
  bootstrapSessionRef.current = bootstrapSession;
  navigationRef.current = navigation;

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
              onPress: () => navigationRef.current.navigate('SignIn'),
            },
          ]);
          return;
        }
        if (result.type === 'session') {
          try {
            const user = apiUserRef.current
              ? await refreshMeRef.current()
              : await bootstrapSessionRef.current();
            const dest = resolvePostAuthDestination({
              flow: 'deeplink',
              apiUser: user,
              session: sessionRef.current,
              signUpBasics: signUpBasicsRef.current,
            });
            navigationRef.current.reset({
              index: 0,
              routes: [{ name: dest.name, params: dest.params as never }],
            });
          } catch (e) {
            Alert.alert(
              'Signed in, but profile failed',
              e instanceof Error
                ? e.message
                : 'Could not load your Mawahib profile. Your session is kept — retry when the backend is available.',
            );
            navigationRef.current.navigate('SignIn');
          }
        }
      } finally {
        handling.current = false;
      }
    };

    if (!initialUrlHandled.current) {
      initialUrlHandled.current = true;
      void Linking.getInitialURL().then((url) => run(url));
    }

    const sub = Linking.addEventListener('url', ({ url }) => {
      void run(url);
    });
    return () => sub.remove();
  }, []);

  return null;
}
