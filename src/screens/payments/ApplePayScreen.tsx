import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ScreenContainer from '../../components/ui/ScreenContainer';
import ActionBusyOverlay from '../../components/ui/ActionBusyOverlay';
import MoneyAmount from '../../components/ui/MoneyAmount';
import PaymentResult from '../../components/payments/PaymentResult';
import { colors, spacing, radius, typography } from '../../theme';
import { ScreenProps, RootStackParamList } from '../../navigation/types';
import { usePayableEngagement } from '../../hooks/usePayableEngagement';
import { useEngagementPayment } from '../../hooks/useEngagementPayment';
import { returnToRequestAfterPayment } from '../../utils/paymentNavigation';
import { PAYMENTS_MOCK_MODE } from '../../config/payments';

/**
 * Mawahib-branded Apple Pay confirmation. This is NOT the native Apple Pay
 * sheet — it never claims a native authorisation. Tapping Pay calls
 * POST /payments with a mock Apple Pay token; the backend decides the outcome.
 */
export default function ApplePayScreen({
  route,
  navigation,
}: ScreenProps<'ApplePay'>) {
  const { engagementId, requestId } = route.params;
  const payable = usePayableEngagement(engagementId);
  const payment = useEngagementPayment(engagementId);

  const done = () =>
    returnToRequestAfterPayment(
      navigation as NativeStackNavigationProp<RootStackParamList>,
      requestId,
    );

  if (payment.succeeded && payment.payment) {
    return (
      <ScreenContainer>
        <StatusBar style="dark" />
        <PaymentResult payment={payment.payment} onDone={done} />
      </ScreenContainer>
    );
  }

  const busy = payment.paying;
  const canPay = payable.canPay && !busy;

  return (
    <ScreenContainer padded={false} backgroundColor={colors.overlay}>
      <StatusBar style="light" />
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        disabled={busy}
        onPress={() => navigation.goBack()}
      />

      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.merchantRow}>
          <View style={styles.merchantIcon}>
            <Text style={styles.merchantInitial}>M</Text>
          </View>
          <View>
            <Text style={styles.merchantName}>Mawahib</Text>
            <Text style={styles.merchantDesc} numberOfLines={1}>
              {payable.engagement?.title ?? 'Service Payment'}
            </Text>
          </View>
        </View>

        {payable.loading ? (
          <ActivityIndicator color={colors.primary} style={styles.loading} />
        ) : payable.amount !== null ? (
          <MoneyAmount
            amount={payable.amount}
            currency={payable.currency}
            size={28}
            style={styles.amountRow}
            textStyle={styles.amount}
          />
        ) : null}

        {payable.blockedReason || payable.error ? (
          <Text style={styles.errorText}>
            {payable.blockedReason ?? payable.error}
          </Text>
        ) : null}
        {payment.error ? (
          <Text style={styles.errorText}>{payment.error}</Text>
        ) : null}

        <TouchableOpacity
          style={[styles.applePayButton, !canPay && styles.applePayDisabled]}
          activeOpacity={0.8}
          disabled={!canPay}
          onPress={() => void payment.pay('apple_pay', 'mock_apple_pay_success')}
        >
          <Ionicons name="logo-apple" size={22} color={colors.white} />
          <Text style={styles.applePayText}>
            {payment.error ? 'Try again' : 'Pay'}
          </Text>
        </TouchableOpacity>

        {PAYMENTS_MOCK_MODE ? (
          <Text style={styles.mockHint}>
            Test payment — no real money is charged.
          </Text>
        ) : null}

        {typeof __DEV__ !== 'undefined' && __DEV__ ? (
          <TouchableOpacity
            disabled={!canPay}
            onPress={() =>
              void payment.pay('apple_pay', 'mock_apple_pay_declined')
            }
            style={styles.devLink}
          >
            <Text style={styles.devLinkText}>Dev: simulate declined payment</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.cancelButton}
          disabled={busy}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <ActionBusyOverlay visible={busy} message="Processing payment…" />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.xxxl,
    paddingTop: spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
  merchantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  merchantIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.button,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  merchantInitial: { ...typography.h3, color: colors.white },
  merchantName: { ...typography.label, color: colors.text },
  merchantDesc: { ...typography.caption, color: colors.textSecondary },
  loading: { marginBottom: spacing.xl },
  amountRow: {
    alignSelf: 'center',
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  amount: { ...typography.h1, color: colors.text, fontWeight: '700' },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  applePayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#000',
    borderRadius: radius.button,
    paddingVertical: spacing.lg,
  },
  applePayDisabled: { opacity: 0.5 },
  applePayText: { ...typography.button, color: colors.white },
  mockHint: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  devLink: { alignItems: 'center', marginTop: spacing.sm },
  devLinkText: { ...typography.caption, color: colors.textSecondary },
  cancelButton: { alignItems: 'center', paddingVertical: spacing.lg },
  cancelText: { ...typography.body, color: colors.textSecondary },
});
