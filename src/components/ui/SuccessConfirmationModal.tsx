import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from './Button';
import { colors, spacing, typography } from '../../theme';

const AUTO_DISMISS_MS = 1800;

export interface SuccessConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  /** Primary button label */
  doneLabel?: string;
  /** Called when the user taps Done or the auto-dismiss timer fires */
  onDone: () => void;
  /** Auto-navigate after a short delay (default true) */
  autoDismiss?: boolean;
}

/**
 * Lightweight success confirmation used after marketplace actions.
 * Matches the SignupSuccess checkmark treatment without leaving the current stack
 * until `onDone` runs.
 */
export default function SuccessConfirmationModal({
  visible,
  title,
  message,
  doneLabel = 'Done',
  onDone,
  autoDismiss = true,
}: SuccessConfirmationModalProps) {
  const insets = useSafeAreaInsets();
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const finished = useRef(false);

  useEffect(() => {
    if (!visible) {
      finished.current = false;
      return;
    }
    if (!autoDismiss) return;
    const timer = setTimeout(() => {
      if (finished.current) return;
      finished.current = true;
      doneRef.current();
    }, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [visible, autoDismiss]);

  const handleDone = () => {
    if (finished.current) return;
    finished.current = true;
    onDone();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDone}
    >
      <Pressable style={styles.backdrop} onPress={handleDone}>
        <Pressable
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, spacing.lg) },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.graphic}>
            <View style={styles.circle}>
              <Ionicons
                name="checkmark-circle"
                size={64}
                color={colors.success}
              />
            </View>
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <Button title={doneLabel} fullWidth onPress={handleDone} />
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.xl,
    gap: spacing.md,
    alignItems: 'center',
  },
  graphic: {
    marginBottom: spacing.xs,
  },
  circle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.success + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
});
