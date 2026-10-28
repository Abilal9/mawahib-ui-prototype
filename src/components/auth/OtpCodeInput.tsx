import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  type TextInputInstance,
  type TextInputKeyPressEvent,
} from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

export const OTP_LENGTH = 6;

export type OtpCodeInputHandle = {
  focus: () => void;
};

type OtpCodeInputProps = {
  code: string[];
  onChange: (code: string[]) => void;
  editable?: boolean;
};

function emptyCode(): string[] {
  return Array(OTP_LENGTH).fill('');
}

/**
 * Six-box code entry shared by email confirmation and password recovery.
 * One native field per box, matching the original confirmation layout.
 * A full paste or OS one-time-code suggestion is spread across the boxes.
 */
const OtpCodeInput = forwardRef<OtpCodeInputHandle, OtpCodeInputProps>(
  function OtpCodeInput({ code, onChange, editable = true }, ref) {
    const inputRefs = useRef<(TextInputInstance | null)[]>([]);
    const boxes = Array.from(
      { length: OTP_LENGTH },
      (_, index) => code[index] ?? '',
    );

    useImperativeHandle(ref, () => ({
      focus: () => inputRefs.current[0]?.focus(),
    }));

    const handleChange = (text: string, index: number) => {
      const digits = text.replace(/\D/g, '');
      if (digits.length > 1) {
        const next = emptyCode();
        const start = digits.length >= OTP_LENGTH ? 0 : index;
        for (let offset = 0; offset < digits.length; offset += 1) {
          const position = start + offset;
          if (position >= OTP_LENGTH) break;
          next[position] = digits[offset];
        }
        if (digits.length < OTP_LENGTH) {
          boxes.forEach((digit, position) => {
            if (position < start || position >= start + digits.length) {
              next[position] = digit;
            }
          });
        }
        onChange(next);
        const focusAt = Math.min(start + digits.length, OTP_LENGTH - 1);
        inputRefs.current[focusAt]?.focus();
        return;
      }

      const digit = digits.slice(-1);
      const next = [...boxes];
      next[index] = digit;
      onChange(next);
      if (digit && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    };

    const handleKeyPress = (
      event: TextInputKeyPressEvent,
      index: number,
    ) => {
      if (event.nativeEvent.key === 'Backspace' && !boxes[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    };

    return (
      <View style={styles.codeRow}>
        {boxes.map((digit, index) => (
          <TextInput
            key={index}
            ref={(node) => {
              inputRefs.current[index] = node;
            }}
            style={[styles.codeBox, digit ? styles.codeBoxFilled : undefined]}
            value={digit}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={(event) => handleKeyPress(event, index)}
            keyboardType="number-pad"
            maxLength={OTP_LENGTH}
            selectTextOnFocus
            editable={editable}
            autoCorrect={false}
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            accessibilityLabel={`Digit ${index + 1} of ${OTP_LENGTH}`}
          />
        ))}
      </View>
    );
  },
);

export default OtpCodeInput;

const styles = StyleSheet.create({
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  codeBox: {
    flex: 1,
    height: 56,
    borderRadius: radius.button,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    textAlign: 'center',
    ...typography.h3,
    color: colors.text,
  },
  codeBoxFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
});
