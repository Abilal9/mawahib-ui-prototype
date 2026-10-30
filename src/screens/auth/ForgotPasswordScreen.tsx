import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import ScreenContainer from '../../components/ui/ScreenContainer';
import TextInput from '../../components/ui/TextInput';
import Button from '../../components/ui/Button';
import AuthBrandHeader from '../../components/auth/AuthBrandHeader';
import OtpCodeInput, { OTP_LENGTH } from '../../components/auth/OtpCodeInput';
import { colors, spacing, typography } from '../../theme';
import { ScreenProps } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { isAuthNetworkError, isAuthRateLimitError } from '../../lib/authErrors';
import {
  loadRecoveryState,
  normalizeRecoveryEmail,
  RECOVERY_REQUEST_COPY,
} from '../../lib/recoveryState';
import { enterSignedOutAt } from '../../lib/productTree';
import { invalidateReturnIntents } from '../../lib/returnIntent';
import { armAuthCallback } from '../../lib/authCallbackTransaction';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_COOLDOWN_SEC = 60;

function isUnknownAccount(error: { message?: string }): boolean {
  const lower = (error.message ?? '').toLowerCase();
  return (
    lower.includes('user not found') ||
    lower.includes('not registered')
  );
}

export default function ForgotPasswordScreen({
  navigation,
  route,
}: ScreenProps<'ForgotPassword'>) {
  const {
    signOut,
    armRecoveryVerification,
    commitRecoverySession,
    clearRecoveryLock,
  } = useAuth();
  const [email, setEmail] = useState(route.params?.email ?? '');
  const [code, setCode] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [cooldown, setCooldown] = useState(0);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const sendRef = useRef(false);
  const verifyRef = useRef(false);
  const requestCodeRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    invalidateReturnIntents();
  }, []);

  useEffect(() => {
    const normalized = normalizeRecoveryEmail(email);
    if (!EMAIL_PATTERN.test(normalized)) return;
    armAuthCallback({ flow: 'recovery', email: normalized });
  }, [email]);

  useEffect(() => {
    if (!route.params?.autoSend) return;
    navigation.setParams({ autoSend: undefined });
    void requestCodeRef.current();
  }, [navigation, route.params?.autoSend]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((current) => (current <= 1 ? 0 : current - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const releaseVerifyingLock = async () => {
    const state = loadRecoveryState();
    if (!state || state.phase !== 'verifying') return;
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        clearRecoveryLock();
        return;
      }
      await signOut('sessionClearForRecovery');
      clearRecoveryLock();
    } catch {
      // Keep the lock if we cannot prove the recovery session is gone.
    }
  };

  const requestCode = async () => {
    if (sendRef.current || verifyRef.current || cooldown > 0) return;
    const normalized = normalizeRecoveryEmail(email);
    if (!EMAIL_PATTERN.test(normalized)) {
      Alert.alert('Check your email', 'Enter a valid email address.');
      return;
    }
    sendRef.current = true;
    setSending(true);
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session || loadRecoveryState()) {
        await signOut('sessionClearForRecovery');
        clearRecoveryLock();
        enterSignedOutAt({
          name: 'ForgotPassword',
          params: { email: normalized, autoSend: true },
        });
        navigation.reset({
          index: 0,
          routes: [
            {
              name: 'ForgotPassword',
              params: { email: normalized, autoSend: true },
            },
          ],
        });
        return;
      }
      const { error } = await supabase.auth.resetPasswordForEmail(normalized);
      if (error && isAuthNetworkError(error)) {
        Alert.alert('Network error', 'Check your connection and try again.');
        return;
      }
      if (
        error &&
        !isAuthRateLimitError(error) &&
        !isUnknownAccount(error)
      ) {
        const lower = error.message.toLowerCase();
        if (lower.includes('invalid') && lower.includes('email')) {
          Alert.alert('Check your email', 'Enter a valid email address.');
          return;
        }
        Alert.alert('Could not send a reset code', 'Please try again.');
        return;
      }
      setStep('code');
      setCooldown(RESEND_COOLDOWN_SEC);
      Alert.alert('Check your email', RECOVERY_REQUEST_COPY);
    } catch (err) {
      Alert.alert(
        'Could not start password reset',
        isAuthNetworkError(err)
          ? 'Check your connection and try again.'
          : err instanceof Error
            ? err.message
            : 'Please try again.',
      );
    } finally {
      sendRef.current = false;
      setSending(false);
    }
  };

  requestCodeRef.current = requestCode;

  const verifyCode = async () => {
    if (verifyRef.current || sendRef.current) return;
    const normalized = normalizeRecoveryEmail(email);
    const token = code.join('').replace(/\D/g, '');
    if (token.length !== 6) {
      Alert.alert('Enter the code', 'The reset code is 6 digits.');
      return;
    }
    verifyRef.current = true;
    setVerifying(true);
    if (!armRecoveryVerification(normalized)) {
      verifyRef.current = false;
      setVerifying(false);
      Alert.alert(
        'Could not start password reset',
        'Please try again.',
      );
      return;
    }
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: normalized,
        token,
        type: 'recovery',
      });
      if (error || !data.session?.user) {
        await releaseVerifyingLock();
        Alert.alert(
          'Code not accepted',
          'That code is incorrect or has expired.',
        );
        return;
      }
      const gotEmail = normalizeRecoveryEmail(data.session.user.email ?? '');
      const userId = data.session.user.id;
      if (gotEmail !== normalized || !commitRecoverySession(normalized, userId)) {
        await releaseVerifyingLock();
        Alert.alert(
          'Could not reset this password',
          'Request a new code and try again.',
        );
        return;
      }
      setCode(Array(OTP_LENGTH).fill(''));
      navigation.reset({
        index: 0,
        routes: [{ name: 'ResetPassword' }],
      });
    } catch {
      await releaseVerifyingLock();
      Alert.alert(
        'Code not accepted',
        'That code is incorrect or has expired.',
      );
    } finally {
      verifyRef.current = false;
      setVerifying(false);
    }
  };

  return (
    <ScreenContainer>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.fixedHeader}>
          <AuthBrandHeader />
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>Reset password</Text>
          <Text style={styles.subtitle}>
            {step === 'email'
              ? 'Enter the email on your Mawahib account.'
              : `Enter the 6-digit code for ${normalizeRecoveryEmail(email)}.`}
          </Text>

          {step === 'email' ? (
            <TextInput
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!sending}
            />
          ) : (
            <OtpCodeInput
              code={code}
              onChange={setCode}
              editable={!verifying && !sending}
            />
          )}

          {step === 'email' ? (
            <Button
              title="Send reset code"
              onPress={() => {
                void requestCode();
              }}
              loading={sending}
              disabled={sending}
            />
          ) : (
            <>
              <Button
                title="Continue"
                onPress={() => {
                  void verifyCode();
                }}
                loading={verifying}
                disabled={
                  verifying ||
                  sending ||
                  code.join('').length !== 6
                }
              />
              <Button
                title={
                  cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'
                }
                variant="outline"
                onPress={() => {
                  void requestCode();
                }}
                loading={sending}
                disabled={sending || cooldown > 0 || verifying}
                style={styles.resend}
              />
            </>
          )}

          <Button
            title="Back to log in"
            variant="ghost"
            onPress={() => navigation.navigate('SignIn')}
            disabled={sending || verifying}
            style={styles.back}
          />
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  fixedHeader: {
    paddingHorizontal: spacing.screen,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  resend: { marginTop: spacing.md },
  back: { marginTop: spacing.sm },
});
