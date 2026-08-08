import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import Button from '../../components/ui/Button';
import { colors, spacing, radius, typography } from '../../theme';
import { ProfileSetupStepProps } from './stepProps';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIME_SLOTS = ['9 AM - 12 PM', '12 PM - 3 PM', '3 PM - 6 PM', '6 PM - 9 PM'];

export default function ProfileSetupStep5({
  onNext,
  onBack,
  onSave,
  step,
  totalSteps,
}: ProfileSetupStepProps) {
  const [selectedDays, setSelectedDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [selectedSlots, setSelectedSlots] = useState<string[]>(['9 AM - 12 PM', '3 PM - 6 PM']);

  const toggle = (item: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.stepLabel}>
          Step {step} of {totalSteps}
        </Text>
        <Text style={styles.title}>Availability</Text>
        <Text style={styles.subtitle}>When are you available for work?</Text>

        <Text style={styles.sectionTitle}>Available Days</Text>
        <View style={styles.chipRow}>
          {DAYS.map((day) => (
            <TouchableOpacity
              key={day}
              style={[styles.chip, selectedDays.includes(day) && styles.chipSelected]}
              onPress={() => toggle(day, selectedDays, setSelectedDays)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, selectedDays.includes(day) && styles.chipTextSelected]}>
                {day}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Time Slots</Text>
        <View style={styles.chipColumn}>
          {TIME_SLOTS.map((slot) => (
            <TouchableOpacity
              key={slot}
              style={[styles.slotChip, selectedSlots.includes(slot) && styles.chipSelected]}
              onPress={() => toggle(slot, selectedSlots, setSelectedSlots)}
              activeOpacity={0.8}
            >
              <Text
                style={[styles.chipText, selectedSlots.includes(slot) && styles.chipTextSelected]}
              >
                {slot}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {onBack ? (
          <Button title="Back" variant="outline" onPress={onBack} style={styles.secondary} />
        ) : null}
        <Button title="Complete Setup" onPress={onNext} fullWidth />
        <Button title="Save & exit" variant="ghost" onPress={onSave} fullWidth style={styles.secondary} />
        <Button title="Skip" variant="ghost" onPress={onNext} fullWidth />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: spacing.xl },
  stepLabel: { ...typography.caption, color: colors.primary, marginBottom: spacing.sm },
  title: { ...typography.h2, color: colors.text, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xxl },
  sectionTitle: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chipColumn: { gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  slotChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.button,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.bodySmall, color: colors.text },
  chipTextSelected: { color: colors.white },
  footer: { paddingBottom: spacing.lg },
  secondary: { marginBottom: spacing.sm },
});
