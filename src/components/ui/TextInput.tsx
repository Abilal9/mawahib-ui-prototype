import React from 'react';
import {
  View,
  TextInput as RNTextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { colors, spacing, radius, typography } from '../../theme';

interface TextInputComponentProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showCharacterCount?: boolean;
}

export default function TextInput({
  label,
  error,
  containerStyle,
  leftIcon,
  rightIcon,
  style,
  showCharacterCount,
  value,
  maxLength,
  ...props
}: TextInputComponentProps) {
  const charCount =
    showCharacterCount && maxLength != null
      ? `${String(value ?? '').length}/${maxLength}`
      : null;

  return (
    <View style={[styles.container, containerStyle]}>
      {(label || charCount) && (
        <View style={styles.labelRow}>
          {label ? <Text style={styles.label}>{label}</Text> : <View />}
          {charCount ? <Text style={styles.charCount}>{charCount}</Text> : null}
        </View>
      )}
      <View style={[styles.inputWrapper, error && styles.inputError]}>
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
        <RNTextInput
          style={[styles.input, leftIcon ? styles.inputWithLeft : undefined, style]}
          placeholderTextColor={colors.textSecondary}
          value={value}
          maxLength={maxLength}
          {...props}
        />
        {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.label,
    color: colors.text,
  },
  charCount: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 48,
  },
  inputError: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  inputWithLeft: {
    paddingLeft: spacing.sm,
  },
  iconLeft: {
    paddingLeft: spacing.lg,
  },
  iconRight: {
    paddingRight: spacing.lg,
  },
  error: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
});
