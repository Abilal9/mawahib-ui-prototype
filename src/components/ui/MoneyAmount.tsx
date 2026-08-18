import React from 'react';
import { View, Text, StyleSheet, StyleProp, TextStyle, ViewStyle } from 'react-native';
import CurrencyIcon from './CurrencyIcon';
import { colors, spacing, typography } from '../../theme';
import type { CurrencyCode } from '../../data/location/geo';
import { formatMoneyAmountDigits, toCurrencyCode } from '../../utils/money';

type Props = {
  /**
   * Numeric amount. Prefer a number; strings should already be amount-only
   * (e.g. "1,284.87") — never "SAR 500.00".
   */
  amount: number | string;
  size?: number;
  color?: string;
  struck?: boolean;
  emphasized?: boolean;
  /** @deprecated Prefer `currency` from the commercial object. */
  location?: string | null;
  /** Commercial object currency — never the viewer's default. */
  currency?: CurrencyCode | string | null;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  /** When amount is free-text (e.g. salary range), skip numeric formatting. */
  rawLabel?: boolean;
};

/** Pink currency logo + amount digits (no SAR/Dhs text prefixes). */
export default function MoneyAmount({
  amount,
  size = 14,
  color = colors.primary,
  struck,
  emphasized,
  location,
  currency,
  style,
  textStyle,
  rawLabel,
}: Props) {
  const iconColor = struck
    ? colors.textSecondary
    : emphasized
      ? colors.primary
      : color;
  const code = toCurrencyCode(
    typeof currency === 'string' ? currency : currency ?? null,
  );
  let label: string;
  if (rawLabel) {
    label = String(amount);
  } else if (typeof amount === 'number') {
    label = formatMoneyAmountDigits(amount);
  } else {
    // Pre-formatted amount-only string from the caller.
    label = String(amount);
  }

  return (
    <View style={[styles.row, style]}>
      <CurrencyIcon
        size={size}
        color={iconColor}
        currency={code}
        location={code != null ? null : location}
      />
      <Text
        style={[
          styles.amount,
          struck && styles.struck,
          emphasized && styles.emphasized,
          textStyle,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 1,
  },
  amount: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
  },
  struck: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
    fontWeight: '500',
  },
  emphasized: {
    color: colors.primary,
    fontWeight: '700',
  },
});
