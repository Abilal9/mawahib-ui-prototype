import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Button from '../../components/ui/Button';
import { colors, spacing, radius, typography } from '../../theme';
import { ScreenProps } from '../../navigation/types';

const WELCOME_CONTENT = {
  1: {
    title: 'Discover Creative Talents',
    subtitle: 'Connect with top designers, developers, photographers, and creatives across the MENA region.',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=400&fit=crop',
  },
  2: {
    title: 'Showcase Your Work',
    subtitle: 'Build your portfolio, share your projects, and get discovered by clients and employers.',
    image: 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=400&h=400&fit=crop',
  },
  3: {
    title: 'Find Your Next Opportunity',
    subtitle: 'Browse job matches, offer services, and grow your creative career on Mawahib.',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=400&fit=crop',
  },
} as const;

export default function WelcomeScreen({ route, navigation }: ScreenProps<'Welcome'>) {
  const step = route.params?.step ?? 1;
  const content = WELCOME_CONTENT[step];
  const isLast = step === 3;

  const handleContinue = () => {
    if (isLast) {
      navigation.navigate('SignUp');
    } else {
      navigation.navigate('Welcome', { step: (step + 1) as 1 | 2 | 3 });
    }
  };

  return (
    <ScreenContainer>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <View style={styles.illustrationContainer}>
          <Image source={{ uri: content.image }} style={styles.illustration} contentFit="cover" />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>{content.title}</Text>
          <Text style={styles.subtitle}>{content.subtitle}</Text>
        </View>

        <View style={styles.dots}>
          {([1, 2, 3] as const).map((i) => (
            <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Button title={isLast ? 'Get Started' : 'Continue'} onPress={handleContinue} fullWidth />
        {!isLast && (
          <Button
            title="Skip"
            variant="ghost"
            onPress={() => navigation.navigate('SignUp')}
            style={styles.skipButton}
          />
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  illustration: {
    width: 280,
    height: 280,
    borderRadius: radius.card,
  },
  textContainer: {
    paddingHorizontal: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xxxl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.primary,
  },
  footer: {
    paddingBottom: spacing.xl,
  },
  skipButton: {
    marginTop: spacing.sm,
  },
});
