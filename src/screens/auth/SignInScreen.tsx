import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import ScreenContainer from '../../components/ui/ScreenContainer';
import TextInput from '../../components/ui/TextInput';
import Button from '../../components/ui/Button';
import AuthBrandHeader from '../../components/auth/AuthBrandHeader';
import { colors, spacing, typography } from '../../theme';
import { RootStackScreenProps } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';
import { useMyProfile } from '../../context/ProfileContext';
import { mapAuthError } from '../../lib/authErrors';
import { hasResumablePendingVerification } from '../../lib/pendingSignup';
import { resolvePostAuthDestination } from '../../lib/postAuthGate';
import { isAuthFailure } from '../../lib/authFailure';

function isRateLimitError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : '';
  const lower = message.toLowerCase();
  const code =
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
      ? (error as { code: string }).code.toLowerCase()
      : '';
  return (
    code === 'over_email_send_rate_limit' ||
    code === 'over_sms_send_rate_limit' ||
    lower.includes('over_email_send_rate_limit') ||
    lower.includes('over_sms_send_rate_limit') ||
    lower.includes('rate limit') ||
    lower.includes('too many requests')
  );
}

export default function SignInScreen({ navigation }: RootStackScreenProps<'SignIn'>) {
  const {
    signInWithEmail,
    resumeEmailVerification,
    bootstrapSession,
    authError,
    clearAuthError,
    session,
    apiUser,
  } = useAuth();
  const { hydrateFromApiUser } = useMyProfile();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const canSubmit = email.trim().length > 0 && password.trim().length > 0 && !loading;
  const backendUnavailable = Boolean(session && !apiUser && authError);

  const handleRetryBackend = async () => {
    clearAuthError();
    setRetrying(true);
    try {
      const user = await bootstrapSession();
      hydrateFromApiUser(user);
      const dest = resolvePostAuthDestination({
        flow: 'signin',
        apiUser: user,
        session,
      });
      navigation.reset({
        index: 0,
        routes: [{ name: dest.name, params: dest.params as never }],
      });
    } catch (e) {
      Alert.alert(
        'Profile still unavailable',
        isAuthFailure(e)
          ? e.message
          : mapAuthError(e, authError || undefined),
      );
    } finally {
      setRetrying(false);
    }
  };

  const handleLogIn = async () => {
    if (!canSubmit) return;
    clearAuthError();
    setLoading(true);
    try {
      const apiUser = await signInWithEmail(email, password);
      hydrateFromApiUser(apiUser);
      const dest = resolvePostAuthDestination({
        flow: 'signin',
        apiUser,
        session: null,
      });
      navigation.reset({
        index: 0,
        routes: [{ name: dest.name, params: dest.params as never }],
      });
    } catch (e) {
      const needsVerify =
        e instanceof Error &&
        ((e as Error & { needsEmailConfirmation?: boolean }).needsEmailConfirmation ||
          (e as Error & { code?: string }).code === 'email_not_confirmed' ||
          /email not confirmed|email_not_confirmed/i.test(e.message));

      if (needsVerify) {
        Alert.alert(
          'Email verification required',
          'Your account exists but email is not verified yet. Resend a code to continue.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Resend code',
              onPress: () => {
                void (async () => {
                  const normalized = email.trim().toLowerCase();
                  try {
                    await resumeEmailVerification(normalized);
                    navigation.navigate('ConfirmCode', { email: normalized });
                  } catch (resendErr) {
                    const resumable = hasResumablePendingVerification(normalized);
                    if (resumable) {
                      // Legitimate prior OTP send — restore ConfirmCode without claiming a new send.
                      Alert.alert(
                        'Verification still pending',
                        isRateLimitError(resendErr)
                          ? 'A new code could not be sent yet (too many requests). If you still have a recent code, you can enter it now. Otherwise wait a minute and resend from the next screen.'
                          : `${mapAuthError(resendErr)}\n\nIf you still have a recent code, you can enter it now.`,
                        [
                          {
                            text: 'Enter code',
                            onPress: () =>
                              navigation.navigate('ConfirmCode', {
                                email: normalized,
                              }),
                          },
                          { text: 'Cancel', style: 'cancel' },
                        ],
                      );
                      return;
                    }

                    Alert.alert(
                      isRateLimitError(resendErr)
                        ? 'Please wait before resending'
                        : 'Unable to send code',
                      isRateLimitError(resendErr)
                        ? 'Too many requests. Wait a minute, then try Resend code again. We did not send a new verification code.'
                        : mapAuthError(resendErr),
                      [{ text: 'OK', style: 'cancel' }],
                    );
                  }
                })();
              },
            },
          ],
        );
        return;
      }
      Alert.alert('Sign in failed', mapAuthError(e, authError || undefined));
    } finally {
      setLoading(false);
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
          <Text style={styles.title}>Log In</Text>
          <Text style={styles.subtitle}>Welcome back! Please enter your details.</Text>

          {backendUnavailable ? (
            <View style={styles.backendBanner}>
              <Text style={styles.backendBannerTitle}>Signed in, profile unavailable</Text>
              <Text style={styles.backendBannerBody}>
                Your Supabase session is active, but Mawahib could not load your
                profile. This is not an OTP failure. Retry when the backend is
                reachable.
              </Text>
              <Button
                title={retrying ? 'Retrying…' : 'Retry profile load'}
                onPress={() => {
                  void handleRetryBackend();
                }}
                disabled={retrying}
              />
            </View>
          ) : null}

          <TextInput
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Button title="Log In" onPress={handleLogIn} disabled={!canSubmit} />
          {loading ? (
            <ActivityIndicator style={{ marginTop: spacing.md }} color={colors.primary} />
          ) : null}

          <View style={styles.footer}>
            <Text style={styles.footerText}>New to Mawahib? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('AccountType')}>
              <Text style={styles.footerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
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
    zIndex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.screen,
    paddingTop: 0,
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
  backendBanner: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    gap: spacing.sm,
  },
  backendBannerTitle: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  backendBannerBody: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xxl,
  },
  footerText: { ...typography.body, color: colors.textSecondary },
  footerLink: { ...typography.bodyMedium, color: colors.primary },
});
