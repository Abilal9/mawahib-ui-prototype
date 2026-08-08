import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import Button from '../../components/ui/Button';
import { colors, spacing, radius, typography } from '../../theme';
import { useMyProfile } from '../../context/ProfileContext';
import { ProfileSetupStepProps } from './stepProps';

const AVAILABLE_SKILLS = [
  'UI Design',
  'UX Design',
  'Figma',
  'Branding',
  'Photography',
  'React Native',
  'TypeScript',
  'Illustration',
  'Video Editing',
  'Copywriting',
  'Motion Design',
  '3D Modeling',
  'SEO',
  'Prototyping',
];

export default function ProfileSetupStep2({
  onNext,
  onBack,
  onSave,
  step,
  totalSteps,
}: ProfileSetupStepProps) {
  const { content, setTalents } = useMyProfile();
  const [selected, setSelected] = useState<string[]>(content.talents ?? []);

  const toggleSkill = (skill: string) => {
    setSelected((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const persist = () => {
    if (selected.length > 0) setTalents(selected);
  };

  const handleContinue = () => {
    persist();
    onNext();
  };

  const handleSave = () => {
    persist();
    onSave();
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.stepLabel}>
          Step {step} of {totalSteps}
        </Text>
        <Text style={styles.title}>Your Skills</Text>
        <Text style={styles.subtitle}>Select skills that describe your expertise</Text>

        <View style={styles.tags}>
          {AVAILABLE_SKILLS.map((skill) => {
            const isSelected = selected.includes(skill);
            return (
              <TouchableOpacity
                key={skill}
                style={[styles.tag, isSelected && styles.tagSelected]}
                onPress={() => toggleSkill(skill)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tagText, isSelected && styles.tagTextSelected]}>{skill}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {onBack ? <Button title="Back" variant="outline" onPress={onBack} fullWidth /> : null}
        <Button
          title="Continue"
          onPress={handleContinue}
          fullWidth
          disabled={selected.length === 0}
        />
        <View style={styles.secondaryRow}>
          <Button title="Skip" variant="outline" onPress={onNext} style={styles.halfBtn} />
          <Button title="Save & exit" variant="outline" onPress={handleSave} style={styles.halfBtn} />
        </View>
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
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tag: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tagText: { ...typography.bodySmall, color: colors.text },
  tagTextSelected: { color: colors.white },
  footer: { gap: spacing.sm, paddingBottom: spacing.lg },
  secondaryRow: { flexDirection: 'row', gap: spacing.sm },
  halfBtn: { flex: 1 },
});
