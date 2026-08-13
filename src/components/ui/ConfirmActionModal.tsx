import React from 'react';
import { Modal, Pressable, Text, StyleSheet, View } from 'react-native';
import Button from './Button';
import { colors, spacing, typography } from '../../theme';

export interface ConfirmActionModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** Destructive confirm styling (reject / archive / close). */
  danger?: boolean;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/** Standard Mawahib confirm sheet used before marketplace mutations. */
export default function ConfirmActionModal({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  danger,
  busy,
  onCancel,
  onConfirm,
}: ConfirmActionModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <Button
              title={cancelLabel}
              variant="secondary"
              style={styles.half}
              disabled={busy}
              onPress={onCancel}
            />
            <Button
              title={confirmLabel}
              style={danger ? { ...styles.half, ...styles.danger } : styles.half}
              disabled={busy}
              onPress={onConfirm}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.screen,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  title: { ...typography.h3, color: colors.text },
  message: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  half: { flex: 1, paddingHorizontal: spacing.md },
  danger: { backgroundColor: colors.error },
});
