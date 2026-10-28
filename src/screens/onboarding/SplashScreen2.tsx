import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import ScreenContainer from '../../components/ui/ScreenContainer';
import SplashBranding from '../../components/onboarding/SplashBranding';
import SplashLoadingDots from '../../components/onboarding/SplashLoadingDots';
import { colors } from '../../theme';
import { ScreenProps } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';
import { resolveColdStartDestination } from '../../lib/coldStartRoute';
import { resolvePostAuthDestination } from '../../lib/postAuthGate';
import { loadRecoveryState } from '../../lib/recoveryState';
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
  const {
    authLoading,
    isSignedIn,
    apiUser,
    session,
    authError,
    signUpBasics,
    recoveryRestart,
  } = useAuth();
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

    const pending = loadPendingSignup();
    const destination = resolveColdStartDestination({
      recovery: Boolean(loadRecoveryState() || recoveryRestart),
      isSignedIn: Boolean(isSignedIn && apiUser),
      apiUser,
      session,
      authError,
      pendingEmail: pending?.email ?? null,
      pendingResumable: Boolean(
        pending?.email && hasResumablePendingVerification(pending.email),
      ),
    });

    if (destination.kind === 'welcome') {
      navigation.replace('Welcome', { step: 1 });
      return;
    }

    if (destination.kind === 'hydrated' && apiUser) {
      const restored = resolvePostAuthDestination({
        flow: 'restore',
        apiUser,
        session,
        signUpBasics,
      });
      navigation.reset({
        index: 0,
        routes: [{ name: restored.name, params: restored.params as never }],
      });
      return;
    }

    if (destination.kind === 'confirm-code') {
      navigation.reset({
        index: 0,
        routes: [
          { name: 'ConfirmCode', params: { email: destination.email } },
        ],
      });
      return;
    }

    navigation.reset({
      index: 0,
      routes: [{ name: 'SignIn' }],
    });
  }, [
    authLoading,
    minSplashDone,
    isSignedIn,
    apiUser,
    session,
    authError,
    signUpBasics,
    navigation,
    recoveryRestart,
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
