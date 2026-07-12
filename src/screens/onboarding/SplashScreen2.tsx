import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import ScreenContainer from '../../components/ui/ScreenContainer';
import { colors, spacing } from '../../theme';
import { ScreenProps } from '../../navigation/types';

export default function SplashScreen2({ navigation }: ScreenProps<'Splash2'>) {
  useEffect(() => {
    const timer = setTimeout(() => navigation.replace('Welcome', { step: 1 }), 2000);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <ScreenContainer padded={false} backgroundColor={colors.background} safeBottom={false}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <Image
          source={require('../../../assets/images/logo.png')}
          style={styles.logo}
          contentFit="contain"
        />
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
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
  logo: {
    width: 56,
    height: 24,
    tintColor: colors.primary,
  },
  loader: {
    marginTop: spacing.xxxl,
  },
});
