import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import type { CountryCode } from 'libphonenumber-js';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Button from '../../components/ui/Button';
import TextInput from '../../components/ui/TextInput';
import Checkbox from '../../components/ui/Checkbox';
import PasswordRequirements from '../../components/auth/PasswordRequirements';
import PhoneInputField from '../../components/auth/PhoneInputField';
import LocationSelectors from '../../components/ui/LocationSelectors';
import { colors, spacing, typography } from '../../theme';
import { ScreenProps } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';
import { mapAuthError } from '../../lib/authErrors';
import { isPasswordValid } from '../../lib/passwordRules';
import { getPhoneValidationMessage, toE164 } from '../../lib/phone';
import {
  locationDisplayFields,
  type CountryCode as GeoCountryCode,
} from '../../data/location/geo';

export default function SignUpScreen({ navigation }: ScreenProps<'SignUp'>) {
  const { accountType, registerWithEmail, clearAuthError } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState<CountryCode>('SA');
  const [nationalNumber, setNationalNumber] = useState('');
  const [countryCode, setCountryCode] = useState<GeoCountryCode>('SA');
  const [locationCode, setLocationCode] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const accountLabel = accountType === 'business' ? 'Business' : 'Talent';
  const passwordOk = isPasswordValid(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const showMismatch =
    (submitted || confirmPassword.length > 0) &&
    password.length > 0 &&
    !passwordsMatch;

  const phoneE164 = useMemo(
    () => toE164(nationalNumber, country),
    [nationalNumber, country],
  );
  const phoneError = useMemo(() => {
    if (!nationalNumber.trim()) {
      return submitted ? 'Phone number is required' : null;
    }
    return getPhoneValidationMessage(nationalNumber, country);
  }, [nationalNumber, country, submitted]);

  const displayName = [firstName.trim(), lastName.trim()]
    .filter(Boolean)
    .join(' ');

  const locationFields =
    countryCode && locationCode
      ? locationDisplayFields(countryCode, locationCode)
      : null;

  const canSubmit = useMemo(
    () =>
      !loading &&
      agreed &&
      !!accountType &&
      firstName.trim().length > 0 &&
      email.trim().length > 0 &&
      !!phoneE164 &&
      !!locationFields &&
      passwordOk &&
      passwordsMatch,
    [
      agreed,
      accountType,
      email,
      firstName,
      loading,
      locationFields,
      passwordOk,
      passwordsMatch,
      phoneE164,
    ],
  );

  const handleSignUp = async () => {
    setSubmitted(true);
    if (!passwordOk) {
      Alert.alert(
        'Weak password',
        'Meet all password requirements before continuing.',
      );
      return;
    }
    if (!passwordsMatch) {
      Alert.alert('Passwords do not match', 'Confirm password must match.');
      return;
    }
    if (!phoneE164) {
      Alert.alert(
        'Invalid phone',
        getPhoneValidationMessage(nationalNumber, country) ||
          'Enter a valid international phone number.',
      );
      return;
    }
    if (!canSubmit || !accountType || !locationFields) return;
    clearAuthError();
    setLoading(true);
    try {
      await registerWithEmail({
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        name: displayName,
        city: locationFields.locationCity,
        countryCode: locationFields.countryCode,
        locationCode: locationFields.locationCode,
        phoneE164,
        accountType,
      });
      navigation.navigate('VerifyAccount', {
        email: email.trim(),
        phoneE164,
      });
    } catch (e) {
      Alert.alert('Sign up failed', mapAuthError(e));
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
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <Image
            source={require('../../../assets/images/logo.png')}
            style={styles.logo}
            contentFit="contain"
          />

          <Text style={styles.title}>Sign Up</Text>
          <Text style={styles.subtitle}>
            Create your {accountLabel.toLowerCase()} account to get started.
          </Text>

          <TextInput
            label="First Name"
            placeholder="First name"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
          />

          <TextInput
            label="Last Name"
            placeholder="Last name (optional)"
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
          />

          <TextInput
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <PhoneInputField
            country={country}
            nationalNumber={nationalNumber}
            onCountryChange={setCountry}
            onNationalNumberChange={setNationalNumber}
            error={phoneError}
          />

          <LocationSelectors
            countryCode={countryCode}
            locationCode={locationCode}
            onCountryChange={(code) => {
              setCountryCode(code);
              if (code === 'SA' || code === 'AE') {
                setCountry(code);
              }
            }}
            onLocationChange={(code) => setLocationCode(code || null)}
          />

          <TextInput
            label="Password"
            placeholder="Create a password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <PasswordRequirements password={password} />

          <TextInput
            label="Confirm Password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
          {showMismatch ? (
            <Text style={styles.errorText}>Passwords do not match</Text>
          ) : null}

          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => setAgreed(!agreed)}
            activeOpacity={0.8}
          >
            <Checkbox checked={agreed} onPress={() => setAgreed(!agreed)} />
            <Text style={styles.termsText}>
              I agree to the <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </TouchableOpacity>

          <Button
            title="Sign Up"
            onPress={() => {
              void handleSignUp();
            }}
            fullWidth
            disabled={!canSubmit}
            style={styles.signUpButton}
          />

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>Or continue with</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
              <Ionicons name="logo-google" size={22} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
              <Ionicons name="logo-apple" size={22} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
              <Ionicons name="logo-facebook" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
              <Text style={styles.footerLink}>Log In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.screen,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  logo: {
    width: 80,
    height: 80,
    alignSelf: 'center',
    marginBottom: spacing.xl,
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
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.xl,
    marginTop: spacing.sm,
  },
  termsText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  termsLink: {
    color: colors.primary,
    fontFamily: typography.label.fontFamily,
  },
  signUpButton: {
    marginBottom: spacing.lg,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
    gap: spacing.sm,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  socialButton: {
    width: 52,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  footerLink: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
});
