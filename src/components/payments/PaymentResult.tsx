import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../ui/Button';
import MoneyAmount from '../ui/MoneyAmount';
import { colors, spacing, typography } from '../../theme';
import type { ApiPayment } from '../../services/paymentsApi';

/** Inline success state shown on the payment screens after a succeeded payment. */
export default function PaymentResult({
  payment,
  onDone,
}: {
  payment: ApiPayment;
  onDone: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.badge}>
        <Ionicons name="checkmark" size={40} color={colors.white} />
      </View>
      <Text style={styles.title}>Payment successful</Text>
      <MoneyAmount
        amount={Number(payment.amount)}
        currency={payment.currency}
        size={22}
        textStyle={styles.amount}
      />
      <Text style={styles.body}>
        The job is now in progress.
        {payment.invoice
          ? ` Invoice ${payment.invoice.invoiceNumber} is available on the request.`
          : ' Your invoice will appear on the request shortly.'}
      </Text>
      <Button title="View request" fullWidth onPress={onDone} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.screen,
    gap: spacing.md,
  },
  badge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: { ...typography.h2, color: colors.text },
  amount: { ...typography.h2, color: colors.text, fontWeight: '700' },
  body: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
});
