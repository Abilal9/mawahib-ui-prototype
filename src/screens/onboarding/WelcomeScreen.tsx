import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Button from '../../components/ui/Button';
import WelcomeStepIndicator from '../../components/onboarding/WelcomeStepIndicator';
import { WELCOME_STEPS } from '../../constants/welcome';
import { colors, spacing, radius, typography } from '../../theme';
import { ScreenProps } from '../../navigation/types';

const HORIZONTAL_PADDING = spacing.xxl; // 24px — Figma screen inset
const ILLUSTRATION_WIDTH = 345;
const ILLUSTRATION_HEIGHT = 237;

export default function WelcomeScreen({ route, navigation }: ScreenProps<'Welcome'>) {
  const step = route.params?.step ?? 1;
  const content = WELCOME_STEPS[step];
  const isLast = step === 3;

  const handleNext = () => {
    if (isLast) {
      navigation.navigate('AccountType');
    } else {
      navigation.navigate('Welcome', { step: (step + 1) as 1 | 2 | 3 });
    }
  };

  const handleSkip = () => {
    navigation.navigate('AccountType');
  };

  return (
    <ScreenContainer padded={false} backgroundColor={colors.background}>
      <StatusBar style="dark" />
      <View style={styles.page}>
        <View style={styles.header}>
          <Image
            source={require('../../../assets/images/arabic-emblem.png')}
            style={styles.logo}
            contentFit="contain"
          />
        </View>

        <Image
          source={{ uri: content.image }}
          style={styles.illustration}
          contentFit="cover"
        />

        <View style={styles.textBlock}>
          <Text style={styles.title}>{content.title}</Text>
          <Text style={styles.subtitle}>{content.subtitle}</Text>
        </View>

        <WelcomeStepIndicator step={step} />

        <View style={styles.footer}>
          <Button
            title={isLast ? 'Get Started' : 'Next'}
            onPress={handleNext}
            fullWidth
            size="md"
          />
          <Button
            title="Skip"
            variant="secondary"
            onPress={handleSkip}
            fullWidth
            size="md"
            style={styles.skipButton}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingBottom: spacing.xl,
  },
  header: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
  },
  logo: {
    // Draw 2× to match home header without growing layout footprint
    position: 'absolute',
    width: 112,
    height: 112,
  },
  illustration: {
    width: '100%',
    maxWidth: ILLUSTRATION_WIDTH,
    height: ILLUSTRATION_HEIGHT,
    borderRadius: radius.card,
    alignSelf: 'center',
    backgroundColor: colors.borderLight,
    marginBottom: spacing.xxl,
  },
  textBlock: {
    marginBottom: spacing.xxl,
  },
  title: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.bodySmall,
    fontSize: 15,
    lineHeight: 24,
    color: colors.textSecondary,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: spacing.xxl,
  },
  skipButton: {
    marginTop: spacing.xl,
  },
});
