import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import TextInput from '../../components/ui/TextInput';
import Button from '../../components/ui/Button';
import { colors, spacing, typography } from '../../theme';

interface StepProps {
  onNext: () => void;
  onBack?: () => void;
  step: number;
  totalSteps: number;
}

export default function ProfileSetupStep1({ onNext, onBack, step, totalSteps }: StepProps) {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.stepLabel}>Step {step} of {totalSteps}</Text>
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
          style={styles.bioInput}
        />
        <TextInput label="Location" placeholder="City, Country" value={location} onChangeText={setLocation} />
      </ScrollView>

      <View style={styles.footer}>
        {onBack && <Button title="Back" variant="outline" onPress={onBack} style={styles.backButton} />}
        <Button title="Continue" onPress={onNext} fullWidth disabled={!name.trim()} />
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
  footer: { paddingBottom: spacing.lg },
  backButton: { marginBottom: spacing.md },
});
