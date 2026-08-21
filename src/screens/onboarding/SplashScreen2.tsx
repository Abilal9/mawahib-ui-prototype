import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import ScreenContainer from '../../components/ui/ScreenContainer';
import SplashBranding from '../../components/onboarding/SplashBranding';
import SplashLoadingDots from '../../components/onboarding/SplashLoadingDots';
import { colors } from '../../theme';
import { ScreenProps } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';
import { resolvePostAuthDestination } from '../../lib/postAuthGate';
import {
  hasResumablePendingVerification,
  loadPendingSignup,
} from '../../lib/pendingSignup';

/**
 * Splash + auth gate:
 * Wait for session restore + Nest /users/me (or bootstrap) before navigating,
 * so the user never briefly lands on Welcome/Main with the wrong identity.
 */
export default function SplashScreen2({ navigation }: ScreenProps<'Splash2'>) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { authLoading, isSignedIn, apiUser, session, signUpBasics } = useAuth();
  const [minSplashDone, setMinSplashDone] = useState(false);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => setMinSplashDone(true), 1200);
    return () => clearTimeout(timer);
  }, [fadeAnim]);

  useEffect(() => {
    if (authLoading || !minSplashDone) return;

    if (isSignedIn && apiUser) {
      const dest = resolvePostAuthDestination({
        flow: 'restore',
        apiUser,
        session,
        signUpBasics,
      });
      navigation.reset({
        index: 0,
        routes: [{ name: dest.name, params: dest.params as never }],
      });
      return;
    }

    // Restore ConfirmCode only when a recent successful OTP send is on record.
    // Do not imply a new code was just sent.
    const pending = loadPendingSignup();
    if (
      pending?.email &&
      !isSignedIn &&
      hasResumablePendingVerification(pending.email)
    ) {
      navigation.reset({
        index: 0,
        routes: [
          {
            name: 'ConfirmCode',
            params: { email: pending.email },
          },
        ],
      });
      return;
    }

    navigation.replace('Welcome', { step: 1 });
  }, [
    authLoading,
    minSplashDone,
    isSignedIn,
    apiUser,
    session,
    signUpBasics,
    navigation,
  ]);

  return (
    <ScreenContainer padded={false} backgroundColor={colors.background} safeBottom={false}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <SplashBranding variant="full" />
          <SplashLoadingDots />
        </Animated.View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
