import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import ScreenContainer from '../../components/ui/ScreenContainer';
import SplashBranding from '../../components/onboarding/SplashBranding';
import { colors } from '../../theme';
import { ScreenProps } from '../../navigation/types';

export default function SplashScreen1({ navigation }: ScreenProps<'Splash1'>) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => navigation.replace('Splash2'), 1500);
    return () => clearTimeout(timer);
  }, [navigation, fadeAnim]);

  return (
    <ScreenContainer padded={false} backgroundColor={colors.background} safeBottom={false}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <SplashBranding variant="icon" />
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
});
