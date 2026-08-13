import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Modal } from 'react-native';
import { colors, spacing, typography } from '../../theme';

/** Full-screen blocking overlay while a marketplace mutation is in flight. */
export default function ActionBusyOverlay({
  visible,
  message = 'Please wait…',
}: {
  visible: boolean;
  message?: string;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay} pointerEvents="auto">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.text}>{message}</Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  text: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
