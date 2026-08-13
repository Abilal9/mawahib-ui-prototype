import React from 'react';
import {
  View,
  Text,
  TextInput as RNTextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import CurrencyIcon from './CurrencyIcon';
import { colors, spacing, radius, typography } from '../../theme';

type Props = Omit<TextInputProps, 'style'> & {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
};

/**
 * Budget/price input with a pink Riyal (or Dirham) logo vertically centered
 * beside the amount — never the "SAR"/"AED" text codes.
 */
export default function MoneyAmountField({
  label,
  error,
  containerStyle,
  ...props
}: Props) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.field, error ? styles.fieldError : null]}>
        <CurrencyIcon size={18} color={colors.primary} />
        <RNTextInput
          style={styles.input}
          placeholderTextColor={colors.textSecondary}
          keyboardType="decimal-pad"
          {...props}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
  },
  fieldError: {
    borderColor: colors.error,
  },
  input: {
    ...typography.body,
    color: colors.text,
    paddingVertical: spacing.md,
    minWidth: 96,
    textAlign: 'center',
  },
  error: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
});
