import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Button from '../../components/ui/Button';
import { colors, spacing, typography } from '../../theme';
import OtpCodeInput, {
  OTP_LENGTH,
  type OtpCodeInputHandle,
} from '../../components/auth/OtpCodeInput';
import { ScreenProps } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';
import {
  authFailureTitle,
  isAccountSuspendedFailure,
  isAuthFailure,
} from '../../lib/authFailure';
import { mapAuthError } from '../../lib/authErrors';
import { clearPendingSignup } from '../../lib/pendingSignup';
import { resolvePostAuthDestination } from '../../lib/postAuthGate';
import { applyPostAuthDestination } from '../../lib/postAuthNavigation';
import { armAuthCallback } from '../../lib/authCallbackTransaction';

const RESEND_COOLDOWN_SEC = 60;
const EDIT_PINK = '#F6339A';

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function ConfirmCodeScreen({
  route,
  navigation,
}: ScreenProps<'ConfirmCode'>) {
  const {
    verifySignupOtp,
    resendSignupOtp,
    verifyPhoneOtp,
    sendPhoneOtp,
    clearAuthError,
    session,
    signUpBasics,
  } = useAuth();
  const [code, setCode] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [timer, setTimer] = useState(RESEND_COOLDOWN_SEC);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const otpRef = useRef<OtpCodeInputHandle>(null);
  const email = route.params?.email || '';
  const phone = route.params?.phone || '';
  const isPhone = Boolean(phone) && !email;

  useEffect(() => {
    if (!email.trim()) return;
    armAuthCallback({ flow: 'signup', email });
  }, [email]);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const isComplete = code.every((digit) => digit !== '');

  const handleChangeEmail = () => {
    clearPendingSignup();
    navigation.navigate('SignUp', { preserveDraft: true });
  };

  const handleVerify = async () => {
    if (!isComplete) return;
    if (!email && !phone) {
      Alert.alert('Missing destination', 'Go back and start signup again.');
      return;
    }
    clearAuthError();
    setLoading(true);
    try {
      if (isPhone) {
        const user = await verifyPhoneOtp(phone, code.join(''));
        const dest = resolvePostAuthDestination({
          flow: 'verify',
          apiUser: user,
          session,
          signUpBasics,
        });
        applyPostAuthDestination(navigation, dest);
        return;
      }

      const user = await verifySignupOtp(email, code.join(''));
      const dest = resolvePostAuthDestination({
        flow: 'verify',
        apiUser: user,
        session,
        signUpBasics,
        pendingEmail: email,
        pendingPhoneE164: signUpBasics?.phoneE164,
      });
      applyPostAuthDestination(navigation, dest);
    } catch (e) {
      if (isAccountSuspendedFailure(e)) return;
      const title = authFailureTitle(e);
      const message = isAuthFailure(e) && e.kind === 'email_otp'
        ? 'The code you entered is incorrect or has expired. Try again or request a new code.'
        : mapAuthError(e);
      Alert.alert(title, message);
      if (isAuthFailure(e) && e.kind === 'email_otp') {
        setCode(Array(OTP_LENGTH).fill(''));
        otpRef.current?.focus();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0 || resending) return;
    if (!email && !phone) return;
    setResending(true);
    try {
      if (isPhone) {
        await sendPhoneOtp(phone);
      } else {
        await resendSignupOtp(email);
      }
      setTimer(RESEND_COOLDOWN_SEC);
      Alert.alert('Code sent', 'Check for a new verification code.');
    } catch (e) {
      Alert.alert('Could not resend code', mapAuthError(e));
    } finally {
      setResending(false);
    }
  };

  return (
    <ScreenContainer>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <Text style={styles.title}>Verify Your Account</Text>
        <Text style={styles.subtitle}>Enter the 6-digit code sent to</Text>

        {isPhone ? (
          <Text style={[styles.destination, styles.phoneDestination]}>{phone}</Text>
        ) : (
          <View style={styles.emailRow}>
            <Text style={styles.destination} numberOfLines={1}>
              {email || 'your email'}
            </Text>
            <TouchableOpacity
              onPress={handleChangeEmail}
              accessibilityRole="button"
              accessibilityLabel="Change email address"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.editHit}
              activeOpacity={0.7}
            >
              <Ionicons name="pencil" size={20} color={EDIT_PINK} />
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.hint}>
          {isPhone
            ? 'Enter the code from your SMS below.'
            : 'Enter the code from your email below.'}
        </Text>

        <OtpCodeInput
          ref={otpRef}
          code={code}
          onChange={setCode}
          editable={!loading}
        />

        <View style={styles.resendRow}>
          <Text style={styles.didntReceive}>Didn&apos;t receive the code?</Text>
          {timer > 0 ? (
            <Text style={styles.timerText}>
              Resend code in {formatCountdown(timer)}
            </Text>
          ) : resending ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <TouchableOpacity onPress={handleResend} activeOpacity={0.8}>
              <Text style={styles.resendLink}>Resend code</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.otherAccount}
          onPress={() => navigation.navigate('SignIn')}
          activeOpacity={0.8}
        >
          <Text style={styles.otherAccountText}>Use a different account</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Button
          title={loading ? 'Verifying…' : 'Verify'}
          onPress={handleVerify}
          fullWidth
          disabled={!isComplete || loading}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingTop: spacing.xxxl,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  destination: {
    ...typography.bodyMedium,
    color: colors.text,
    flexShrink: 1,
  },
  phoneDestination: {
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  editHit: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hint: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: spacing.xxxl,
  },
  resendRow: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  didntReceive: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  timerText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  resendLink: {
    ...typography.bodyMedium,
    color: colors.primary,
  },
  otherAccount: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  otherAccountText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  footer: {
    paddingBottom: spacing.xl,
  },
});
