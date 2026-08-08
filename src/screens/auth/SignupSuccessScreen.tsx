import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Button from '../../components/ui/Button';
import { colors, spacing, typography } from '../../theme';
import { ScreenProps } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';
import { useMyProfile } from '../../context/ProfileContext';

export default function SignupSuccessScreen({ navigation }: ScreenProps<'SignupSuccess'>) {
  const insets = useSafeAreaInsets();
  const { signUpBasics, completeSignUp } = useAuth();
  const { applySignupProfile } = useMyProfile();

  const finish = (goToProfile: boolean) => {
    const name = signUpBasics?.name?.trim() || 'New Member';
    const location = signUpBasics?.city?.trim() || '';
    applySignupProfile({ name, location });
    completeSignUp();

    if (goToProfile) {
      navigation.reset({
        index: 1,
        routes: [{ name: 'MainTabs' }, { name: 'Profile' }],
      });
      return;
    }

    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

  return (
    <ScreenContainer padded={false} backgroundColor={colors.white}>
      <StatusBar style="dark" />
      <View style={styles.body}>
        <View style={styles.graphic}>
          <View style={styles.circle}>
            <Ionicons name="person-outline" size={72} color={colors.text} />
          </View>
          <View style={styles.badge}>
            <Ionicons name="checkmark" size={28} color={colors.white} />
          </View>
        </View>
        <Text style={styles.title}>You&apos;re all set!</Text>
        <Text style={styles.subtitle}>
          Your account was created successfully. You can explore Mawahib now and finish your
          profile whenever you&apos;re ready.
        </Text>
      </View>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <Button title="Get Started" fullWidth onPress={() => finish(false)} />
        <Button
          title="Go to Profile"
          variant="ghost"
          fullWidth
          onPress={() => finish(true)}
          style={styles.secondary}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  graphic: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  circle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    bottom: 8,
    right: 18,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
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
  footer: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.md,
  },
  secondary: {
    marginTop: spacing.sm,
  },
});
