import React from 'react';
import { View, Text, StyleSheet, StyleProp, TextStyle, ViewStyle } from 'react-native';
import CurrencyIcon from './CurrencyIcon';
import { colors, spacing, typography } from '../../theme';

type Props = {
  /** Numeric label only — no currency code. */
  amount: string;
  size?: number;
  color?: string;
  struck?: boolean;
  emphasized?: boolean;
  location?: string | null;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

/** Pink currency logo + amount, for price rows throughout the app. */
export default function MoneyAmount({
  amount,
  size = 14,
  color = colors.primary,
  struck,
  emphasized,
  location,
  style,
  textStyle,
}: Props) {
  const iconColor = struck ? colors.textSecondary : emphasized ? colors.primary : color;
  return (
    <View style={[styles.row, style]}>
      <CurrencyIcon size={size} color={iconColor} location={location} />
      <Text
        style={[
          styles.amount,
          struck && styles.struck,
          emphasized && styles.emphasized,
          textStyle,
        ]}
        numberOfLines={1}
      >
        {amount}
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
