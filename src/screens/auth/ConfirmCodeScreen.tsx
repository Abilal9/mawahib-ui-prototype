import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput as RNTextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Button from '../../components/ui/Button';
import { colors, spacing, radius, typography } from '../../theme';
import { ScreenProps } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';
import { mapAuthError } from '../../lib/authErrors';

const CODE_LENGTH = 6;

export default function ConfirmCodeScreen({ route, navigation }: ScreenProps<'ConfirmCode'>) {
  const {
    verifySignupOtp,
    resendSignupOtp,
    verifyPhoneOtp,
    sendPhoneOtp,
    clearAuthError,
  } = useAuth();
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(RNTextInput | null)[]>([]);
  const email = route.params?.email || '';
  const phone = route.params?.phone || '';
  const destination = email || phone || 'your device';
  const isPhone = Boolean(phone) && !email;

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (text: string, index: number) => {
    const digit = text.slice(-1);
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
        await verifyPhoneOtp(phone, code.join(''));
      } else {
        await verifySignupOtp(email, code.join(''));
      }
      navigation.navigate('TurnOnNotifications');
    } catch (e) {
      Alert.alert('Verification failed', mapAuthError(e));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email && !phone) return;
    try {
      if (isPhone) {
        await sendPhoneOtp(phone);
      } else {
        await resendSignupOtp(email);
      }
      setTimer(60);
      Alert.alert('Code sent', 'Check for a new verification code.');
    } catch (e) {
      Alert.alert('Could not resend code', mapAuthError(e));
    }
  };

  return (
    <ScreenContainer>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <Text style={styles.title}>Verify Your Account</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to{'\n'}
          <Text style={styles.destination}>{destination}</Text>
          {isPhone
            ? '\n\nUse the SMS code — do not share it with anyone.'
            : '\n\nUse the code from your email — do not open confirmation links in a browser (they can expire).'}
        </Text>

        <View style={styles.codeRow}>
          {code.map((digit, index) => (
            <RNTextInput
              key={index}
              ref={(ref) => { inputRefs.current[index] = ref; }}
              style={[styles.codeBox, digit ? styles.codeBoxFilled : undefined]}
              value={digit}
              onChangeText={(text) => handleChange(text, index)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        <View style={styles.resendRow}>
          {timer > 0 ? (
            <Text style={styles.timerText}>Resend code in {timer}s</Text>
          ) : (
            <TouchableOpacity onPress={handleResend} activeOpacity={0.8}>
              <Text style={styles.resendLink}>Resend Code</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          title="Verify"
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
    marginBottom: spacing.xxxl,
  },
  destination: {
    color: colors.text,
    fontFamily: typography.label.fontFamily,
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
  },
  timerText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  resendLink: {
    ...typography.bodyMedium,
    color: colors.primary,
  },
  footer: {
    paddingBottom: spacing.xl,
  },
});
