import React, { useEffect, useRef, useState } from 'react';
import { Alert, View, Text, ScrollView, StyleSheet } from 'react-native';
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

type SaveAction = 'continue' | 'exit';

export default function ProfileSetupStep1({
  onNext,
  onSave,
  step,
  totalSteps,
}: ProfileSetupStepProps) {
  const { user, content, saveProfileBasics } = useMyProfile();
  const [name, setName] = useState(user.name ?? '');
  const [bio, setBioDraft] = useState(content.bio ?? '');
  const [countryCode, setCountryCode] = useState<CountryCode | null>(
    normalizeCountryCode(user.countryCode) ?? 'SA',
  );
  const [locationCode, setLocationCode] = useState<string | null>(
    user.locationCode ?? null,
  );
  const [savingAction, setSavingAction] = useState<SaveAction | null>(null);
  const saveInFlightRef = useRef(false);
  const mountedRef = useRef(true);
  const initialCountryRef = useRef(normalizeCountryCode(user.countryCode));
  const initialLocationRef = useRef(user.locationCode ?? null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const saving = savingAction !== null;
  const nameMissing = name.trim().length === 0;
  const displayedInitialCountry = initialCountryRef.current ?? 'SA';
  const locationDirty =
    countryCode !== displayedInitialCountry ||
    locationCode !== initialLocationRef.current;
  const locationComplete = Boolean(countryCode && locationCode);

  const persist = async (action: SaveAction, afterSuccess: () => void) => {
    if (saveInFlightRef.current) return;
    const trimmedName = name.trim();
    if (!trimmedName) return;
    if (locationDirty && !locationComplete) {
      Alert.alert('Choose a city', 'Please select a city.');
      return;
    }

    saveInFlightRef.current = true;
    setSavingAction(action);
    try {
      await saveProfileBasics({
        name: trimmedName,
        bio: bio.trim(),
        ...(countryCode && locationCode ? { countryCode, locationCode } : {}),
      });
      if (mountedRef.current) afterSuccess();
    } catch {
      if (mountedRef.current) {
        Alert.alert('Could not save profile', 'Please try again.');
      }
    } finally {
      saveInFlightRef.current = false;
      if (mountedRef.current) setSavingAction(null);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.stepLabel}>
          Step {step} of {totalSteps}
        </Text>
        <Text style={styles.title}>Basic Info</Text>
        <Text style={styles.subtitle}>Tell us about yourself</Text>

        <TextInput
          label="Full Name"
          placeholder="Your name"
          value={name}
          onChangeText={setName}
          editable={!saving}
        />
        <TextInput
          label="Bio"
          placeholder="A short bio about you and your work..."
          value={bio}
          onChangeText={setBioDraft}
          multiline
          numberOfLines={4}
          maxLength={500}
          showCharacterCount
          style={styles.bioInput}
          editable={!saving}
        />
        <LocationSelectors
          countryCode={countryCode}
          locationCode={locationCode}
          onCountryChange={setCountryCode}
          onLocationChange={(code) => setLocationCode(code || null)}
          disabled={saving}
        />
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Continue"
          onPress={() => {
            void persist('continue', onNext);
          }}
          fullWidth
          disabled={nameMissing || saving}
          loading={savingAction === 'continue'}
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
              void persist('exit', onSave);
            }}
            disabled={nameMissing || saving}
            loading={savingAction === 'exit'}
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
  bioInput: { minHeight: 100, textAlignVertical: 'top' },
  footer: { gap: spacing.sm, paddingBottom: spacing.lg },
  secondaryRow: { flexDirection: 'row', gap: spacing.sm },
  halfBtn: { flex: 1 },
});
