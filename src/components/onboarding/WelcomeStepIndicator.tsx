import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme';

interface WelcomeStepIndicatorProps {
  step: 1 | 2 | 3;
}

export default function WelcomeStepIndicator({ step }: WelcomeStepIndicatorProps) {
  return (
    <View style={styles.row}>
      {([1, 2, 3] as const).map((i) => (
        <View
          key={i}
          style={i === step ? styles.activePill : styles.inactiveDot}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 16,
  },
  activePill: {
    width: 36,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  inactiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
});
