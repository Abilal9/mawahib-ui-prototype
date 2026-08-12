import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme';
import { evaluatePassword } from '../../lib/passwordRules';

export default function PasswordRequirements({ password }: { password: string }) {
  const checks = evaluatePassword(password);

  return (
    <View style={styles.wrap} accessibilityRole="summary">
      {checks.map((check) => (
        <View key={check.id} style={styles.row}>
          <Ionicons
            name={check.met ? 'checkmark-circle' : 'ellipse-outline'}
            size={16}
            color={check.met ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.label,
              check.met ? styles.labelMet : styles.labelPending,
            ]}
          >
            {check.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    ...typography.caption,
  },
  labelMet: {
    color: colors.primary,
  },
  labelPending: {
    color: colors.textSecondary,
  },
});
