import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import ScreenContainer from '../../components/ui/ScreenContainer';
import SplashBranding from '../../components/onboarding/SplashBranding';
import SplashLoadingDots from '../../components/onboarding/SplashLoadingDots';
import { colors } from '../../theme';
import { ScreenProps } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';

/**
 * Splash + auth gate:
 * Wait for session restore + Nest /users/me (or bootstrap) before navigating,
 * so the user never briefly lands on Welcome/Main with the wrong identity.
 */
export default function SplashScreen2({ navigation }: ScreenProps<'Splash2'>) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { authLoading, isSignedIn, apiUser, signUpBasics } = useAuth();
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
      if (!apiUser.emailVerified) {
        const email = apiUser.email || signUpBasics?.email;
        const phoneE164 = apiUser.phoneE164 || signUpBasics?.phoneE164;
        if (email && phoneE164) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'VerifyAccount', params: { email, phoneE164 } }],
          });
          return;
        }
        if (email) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'ConfirmCode', params: { email } }],
          });
          return;
        }
      }
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
      return;
    }

    navigation.replace('Welcome', { step: 1 });
  }, [
    authLoading,
    minSplashDone,
    isSignedIn,
    apiUser,
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
