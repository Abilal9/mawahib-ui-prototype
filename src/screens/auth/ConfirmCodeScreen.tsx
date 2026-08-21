import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput as RNTextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Button from '../../components/ui/Button';
import { colors, spacing, radius, typography } from '../../theme';
import { ScreenProps } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';
import { authFailureTitle, isAuthFailure } from '../../lib/authFailure';
import { mapAuthError } from '../../lib/authErrors';
import { clearPendingSignup } from '../../lib/pendingSignup';
import { resolvePostAuthDestination } from '../../lib/postAuthGate';

const CODE_LENGTH = 6;
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
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [timer, setTimer] = useState(RESEND_COOLDOWN_SEC);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(RNTextInput | null)[]>([]);
  const email = route.params?.email || '';
  const phone = route.params?.phone || '';
  const isPhone = Boolean(phone) && !email;

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (text: string, index: number) => {
    const digit = text.replace(/\D/g, '').slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const isComplete = code.every((d) => d !== '');

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
        navigation.reset({
          index: 0,
          routes: [{ name: dest.name, params: dest.params as never }],
        });
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
      navigation.reset({
        index: 0,
        routes: [{ name: dest.name, params: dest.params as never }],
      });
    } catch (e) {
      const title = authFailureTitle(e);
      const message = isAuthFailure(e) && e.kind === 'email_otp'
        ? 'The code you entered is incorrect or has expired. Try again or request a new code.'
        : mapAuthError(e);
      Alert.alert(title, message);
      if (isAuthFailure(e) && e.kind === 'email_otp') {
        setCode(Array(CODE_LENGTH).fill(''));
        inputRefs.current[0]?.focus();
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

        <View style={styles.codeRow}>
          {code.map((digit, index) => (
            <RNTextInput
              key={index}
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              style={[styles.codeBox, digit ? styles.codeBoxFilled : undefined]}
              value={digit}
              onChangeText={(text) => handleChange(text, index)}
              onKeyPress={({ nativeEvent }) =>
                handleKeyPress(nativeEvent.key, index)
              }
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              editable={!loading}
            />
          ))}
        </View>

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
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  codeBox: {
    flex: 1,
    height: 56,
    borderRadius: radius.button,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    textAlign: 'center',
    ...typography.h3,
    color: colors.text,
  },
  codeBoxFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
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
