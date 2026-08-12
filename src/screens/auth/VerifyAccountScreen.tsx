import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import ScreenContainer from '../../components/ui/ScreenContainer';
import { colors, spacing, radius, typography } from '../../theme';
import { ScreenProps } from '../../navigation/types';
import { appEnv } from '../../config/env';
import { useAuth } from '../../context/AuthContext';
import { mapAuthError } from '../../lib/authErrors';

/**
 * Choose verification method after signup.
 * Email OTP is always available (Supabase Auth).
 * Phone OTP activates when EXPO_PUBLIC_PHONE_AUTH_ENABLED=true and SMS is configured.
 */
export default function VerifyAccountScreen({
  route,
  navigation,
}: ScreenProps<'VerifyAccount'>) {
  const { sendPhoneOtp, session, apiUser, clearAuthError } = useAuth();
  const email = route.params.email;
  const phoneE164 = route.params.phoneE164;
  const phoneEnabled = appEnv.phoneAuthEnabled;
  const emailAlreadyVerified = Boolean(
    apiUser?.emailVerified ||
      session?.user?.email_confirmed_at ||
      session?.user?.confirmed_at,
  );

  const phoneSubtitle = useMemo(() => {
    if (!phoneEnabled) {
      return 'Available once SMS verification is enabled';
    }
    if (!session) {
      return 'Verify email first, then you can verify phone';
    }
    return phoneE164;
  }, [phoneEnabled, session, phoneE164]);

  const onEmail = () => {
    navigation.navigate('ConfirmCode', { email });
  };

  const onPhone = async () => {
    if (!phoneEnabled) {
      Alert.alert(
        'SMS not enabled',
        'Phone verification will activate automatically once an SMS provider is configured in Supabase. Email verification is required to continue.',
      );
      return;
    }
    if (!session) {
      Alert.alert(
        'Verify email first',
        'Confirm your email to create a session, then return here to verify your phone on the same account.',
      );
      return;
    }
    clearAuthError();
    try {
      await sendPhoneOtp(phoneE164);
      navigation.navigate('ConfirmCode', { phone: phoneE164 });
    } catch (e) {
      Alert.alert('Could not send SMS', mapAuthError(e));
    }
  };

  return (
    <ScreenContainer>
      <StatusBar style="dark" />
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>

      <Text style={styles.title}>Verify your account</Text>
      <Text style={styles.subtitle}>Choose a verification method</Text>

      <TouchableOpacity
        style={styles.option}
        onPress={onEmail}
        activeOpacity={0.85}
      >
        <View style={styles.optionIcon}>
          <Ionicons name="mail-outline" size={22} color={colors.primary} />
        </View>
        <View style={styles.optionBody}>
          <Text style={styles.optionTitle}>Email</Text>
          <Text style={styles.optionMeta}>{email}</Text>
        </View>
        <Ionicons name="checkmark-circle" size={22} color={colors.success} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.option, !phoneEnabled && styles.optionDisabled]}
        onPress={() => {
          void onPhone();
        }}
        activeOpacity={phoneEnabled ? 0.85 : 1}
      >
        <View style={styles.optionIcon}>
          <Ionicons
            name="phone-portrait-outline"
            size={22}
            color={phoneEnabled ? colors.primary : colors.textSecondary}
          />
        </View>
        <View style={styles.optionBody}>
          <Text
            style={[
              styles.optionTitle,
              !phoneEnabled && styles.optionTitleMuted,
            ]}
          >
            Phone
          </Text>
          <Text style={styles.optionMeta}>{phoneSubtitle}</Text>
        </View>
        {phoneEnabled ? (
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        ) : (
          <Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} />
        )}
      </TouchableOpacity>

      {emailAlreadyVerified ? (
        <TouchableOpacity
          style={styles.continueBtn}
          onPress={() => navigation.navigate('TurnOnNotifications')}
          activeOpacity={0.85}
        >
          <Text style={styles.continueText}>Continue</Text>
        </TouchableOpacity>
      ) : null}

      <Text style={styles.hint}>
        Email verification is required before entering Mawahib. Phone verification
        is optional until SMS is enabled.
      </Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  back: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    backgroundColor: colors.white,
    marginBottom: spacing.md,
  },
  optionDisabled: {
    backgroundColor: colors.background,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionBody: { flex: 1 },
  optionTitle: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  optionTitleMuted: {
    color: colors.textSecondary,
  },
  optionMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: spacing.md,
  },
  continueBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  continueText: {
    ...typography.bodyMedium,
    color: colors.white,
  },
});
