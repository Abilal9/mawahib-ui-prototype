import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  PanResponder,
  LayoutChangeEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../../theme';
import { TALENT_CHIP_STYLES } from '../../data/types';
import { normalizeTalentList } from '../../utils/aboutFormat';

const MAX_TALENTS = 40;
const MAX_LEN = 60;

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
};

/**
 * Draft talent chip manager: add, × remove, drag reorder.
 * Persists only when parent Save is pressed.
 */
export default function TalentChipsEditor({ value, onChange, disabled }: Props) {
  const [draft, setDraft] = useState('');
  const [dragging, setDragging] = useState<number | null>(null);
  const layoutYs = useRef<number[]>([]);
  const itemsRef = useRef(value);
  itemsRef.current = value;

  const addTalent = () => {
    const next = normalizeTalentList([...value, draft]);
    if (next.length === value.length && !draft.trim()) {
      setDraft('');
      return;
    }
    if (next.length > MAX_TALENTS) return;
    onChange(next.slice(0, MAX_TALENTS));
    setDraft('');
  };

  const removeAt = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const move = (from: number, to: number) => {
    if (from === to || to < 0 || to >= itemsRef.current.length) return;
    const next = [...itemsRef.current];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  const onChipLayout = (index: number, e: LayoutChangeEvent) => {
    layoutYs.current[index] = e.nativeEvent.layout.y;
  };

  const createPan = (index: number) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 4,
      onPanResponderGrant: () => setDragging(index),
      onPanResponderMove: (_, g) => {
        const originY = layoutYs.current[index] ?? 0;
        const fingerY = originY + g.dy;
        let target = index;
        for (let i = 0; i < layoutYs.current.length; i += 1) {
          const y = layoutYs.current[i];
          if (y == null) continue;
          if (fingerY + 12 >= y) target = i;
        }
        if (target !== index) {
          move(index, target);
          setDragging(target);
        }
      },
      onPanResponderRelease: () => setDragging(null),
      onPanResponderTerminate: () => setDragging(null),
    });

  return (
    <View style={styles.wrap}>
      <View style={styles.chipWrap}>
        {value.map((talent, index) => {
          const tone = TALENT_CHIP_STYLES[index % TALENT_CHIP_STYLES.length];
          const pan = createPan(index);
          return (
            <View
              key={`${talent}-${index}`}
              style={[
                styles.chip,
                { backgroundColor: tone.bg },
                dragging === index && styles.chipDragging,
              ]}
              onLayout={(e) => onChipLayout(index, e)}
              {...pan.panHandlers}
            >
              <Ionicons
                name="reorder-three"
                size={14}
                color={tone.text}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.chipText, { color: tone.text }]}>{talent}</Text>
              <TouchableOpacity
                onPress={() => removeAt(index)}
                hitSlop={8}
                disabled={disabled}
                accessibilityLabel={`Remove ${talent}`}
              >
                <Ionicons name="close" size={14} color={tone.text} />
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={(t) => setDraft(t.slice(0, MAX_LEN))}
          placeholder="Add a talent…"
          placeholderTextColor={colors.textSecondary}
          editable={!disabled && value.length < MAX_TALENTS}
          onSubmitEditing={addTalent}
          returnKeyType="done"
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[styles.addBtn, (!draft.trim() || disabled) && styles.addBtnDisabled]}
          onPress={addTalent}
          disabled={!draft.trim() || disabled || value.length >= MAX_TALENTS}
        >
          <Ionicons name="add" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>
      <Text style={styles.hint}>
        {value.length}/{MAX_TALENTS} · drag chips to reorder · Save to persist
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    minHeight: 36,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.button,
  },
  chipDragging: {
    opacity: 0.85,
    transform: [{ scale: 1.03 }],
  },
  chipText: {
    ...typography.caption,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.white,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: {
    opacity: 0.4,
  },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
