import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

interface CheckboxProps {
  checked: boolean;
  onPress: () => void;
  size?: number;
}

export default function Checkbox({ checked, onPress, size = 22 }: CheckboxProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View
        style={[
          styles.box,
          { width: size, height: size, borderRadius: 6 },
          checked && styles.checked,
        ]}
      >
        {checked && <Ionicons name="checkmark" size={size - 6} color={colors.white} />}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  checked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
});
