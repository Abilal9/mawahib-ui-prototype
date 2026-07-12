import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import Button from '../../components/ui/Button';
import { colors, spacing, radius, typography } from '../../theme';

const AVAILABLE_SKILLS = [
  'UI Design', 'UX Design', 'Figma', 'Branding', 'Photography',
  'React Native', 'TypeScript', 'Illustration', 'Video Editing',
  'Copywriting', 'Motion Design', '3D Modeling', 'SEO', 'Prototyping',
];

interface StepProps {
  onNext: () => void;
  onBack?: () => void;
  step: number;
  totalSteps: number;
}

export default function ProfileSetupStep2({ onNext, onBack, step, totalSteps }: StepProps) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggleSkill = (skill: string) => {
    setSelected((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.stepLabel}>Step {step} of {totalSteps}</Text>
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
        {onBack && <Button title="Back" variant="outline" onPress={onBack} style={styles.backButton} />}
        <Button title="Continue" onPress={onNext} fullWidth disabled={selected.length === 0} />
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
  footer: { paddingBottom: spacing.lg },
  backButton: { marginBottom: spacing.md },
});
