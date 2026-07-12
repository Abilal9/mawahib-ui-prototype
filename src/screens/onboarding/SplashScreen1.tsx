import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import ScreenContainer from '../../components/ui/ScreenContainer';
import { colors } from '../../theme';
import { ScreenProps } from '../../navigation/types';

export default function SplashScreen1({ navigation }: ScreenProps<'Splash1'>) {
  useEffect(() => {
    const timer = setTimeout(() => navigation.replace('Splash2'), 1500);
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
});
