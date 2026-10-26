import React, { useEffect, useRef, useState } from 'react';
import { Alert, View, Text, ScrollView, StyleSheet } from 'react-native';
import Button from '../../components/ui/Button';
import TalentChipsEditor from '../../components/profile/TalentChipsEditor';
import { colors, spacing, typography } from '../../theme';
import { useMyProfile } from '../../context/ProfileContext';
import { selectionsFromProfile, type ProfileSkillSelection } from '../../domain/profileSkills';
import { ApiError } from '../../lib/apiClient';
import { ProfileSetupStepProps } from './stepProps';

export default function ProfileSetupStep2({
  onNext,
  onBack,
  onSave,
  step,
  totalSteps,
}: ProfileSetupStepProps) {
  const { content, setTalentSelections } = useMyProfile();
  const [selected, setSelected] = useState<ProfileSkillSelection[]>(() =>
    selectionsFromProfile({
      skills: content.talents,
      skillSelections: content.talentSelections,
    }),
  );
  const [saving, setSaving] = useState(false);
  const saveInFlightRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const persistAnd = async (next: () => void) => {
    if (saveInFlightRef.current) return;
    saveInFlightRef.current = true;
    try {
      setSaving(true);
      await setTalentSelections(selected);
      if (mountedRef.current) next();
    } catch (err) {
      const canonical =
        err instanceof ApiError && err.code === 'SKILL_MATCHES_CANONICAL'
          ? err.nameEn
          : null;
      if (mountedRef.current) {
        Alert.alert(
          'Could not save skills',
          canonical
            ? `Choose ${canonical} from the suggestions.`
            : err instanceof Error
              ? err.message
              : 'Please try again',
        );
      }
    } finally {
      saveInFlightRef.current = false;
      if (mountedRef.current) setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.stepLabel}>
          Step {step} of {totalSteps}
        </Text>
        <Text style={styles.title}>Your Skills</Text>
        <Text style={styles.subtitle}>
          Search for a skill, or add your own if it isn’t listed.
        </Text>
        <TalentChipsEditor value={selected} onChange={setSelected} disabled={saving} />
      </ScrollView>

      <View style={styles.footer}>
        {onBack ? (
          <Button
            title="Back"
            variant="outline"
            onPress={() => {
              if (saveInFlightRef.current || !onBack) return;
              onBack();
            }}
            disabled={saving}
            fullWidth
          />
        ) : null}
        <Button
          title="Continue"
          onPress={() => {
            void persistAnd(onNext);
          }}
          fullWidth
          disabled={saving || selected.length === 0}
        />
        <View style={styles.secondaryRow}>
          <Button
            title="Skip"
            variant="outline"
            onPress={() => {
              if (saveInFlightRef.current) return;
              onNext();
            }}
            disabled={saving}
            style={styles.halfBtn}
          />
          <Button
            title="Save & exit"
            variant="outline"
            onPress={() => {
              void persistAnd(onSave);
            }}
            disabled={saving}
            style={styles.halfBtn}
          />
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
  footer: { gap: spacing.sm, paddingBottom: spacing.lg },
  secondaryRow: { flexDirection: 'row', gap: spacing.sm },
  halfBtn: { flex: 1 },
});
