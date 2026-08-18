import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import TextInput from '../../components/ui/TextInput';
import Button from '../../components/ui/Button';
import LocationSelectors from '../../components/ui/LocationSelectors';
import { colors, spacing, typography } from '../../theme';
import { useMyProfile } from '../../context/ProfileContext';
import { ProfileSetupStepProps } from './stepProps';
import {
  normalizeCountryCode,
  type CountryCode,
} from '../../data/location/geo';

export default function ProfileSetupStep1({
  onNext,
  onSave,
  step,
  totalSteps,
}: ProfileSetupStepProps) {
  const { user, content, updateProfileBasics, setBio: saveBio } = useMyProfile();
  const [name, setName] = useState(user.name ?? '');
  const [bio, setBio] = useState(content.bio ?? '');
  const [countryCode, setCountryCode] = useState<CountryCode | null>(
    normalizeCountryCode(user.countryCode) ?? 'SA',
  );
  const [locationCode, setLocationCode] = useState<string | null>(
    user.locationCode ?? null,
  );

  const persist = () => {
    updateProfileBasics({
      name: name.trim(),
      ...(countryCode && locationCode
        ? { countryCode, locationCode }
        : {}),
    });
    saveBio(bio.trim());
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
        <Text style={styles.title}>Basic Info</Text>
        <Text style={styles.subtitle}>Tell us about yourself</Text>

        <TextInput label="Full Name" placeholder="Your name" value={name} onChangeText={setName} />
        <TextInput
          label="Bio"
          placeholder="A short bio about you and your work..."
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={4}
          maxLength={500}
          showCharacterCount
          style={styles.bioInput}
        />
        <LocationSelectors
          countryCode={countryCode}
          locationCode={locationCode}
          onCountryChange={setCountryCode}
          onLocationChange={(code) => setLocationCode(code || null)}
        />
      </ScrollView>

      <View style={styles.footer}>
        <Button title="Continue" onPress={handleContinue} fullWidth disabled={!name.trim()} />
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
  bioInput: { minHeight: 100, textAlignVertical: 'top' },
  footer: { gap: spacing.sm, paddingBottom: spacing.lg },
  secondaryRow: { flexDirection: 'row', gap: spacing.sm },
  halfBtn: { flex: 1 },
});
